import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2, XCircle, Clock,
  Search, X, ChevronDown, Calendar, FileText,
  ClipboardCheck, Image as ImageIcon, LayoutList, BarChart2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

// ── Types ──────────────────────────────────────────────────
type DayStatus =
  | "未排班" | "待上班"
  | "正常" | "遲到早退" | "缺勤"
  | "補卡待審核" | "已補卡";

type CorrectionStatus = "待審核" | "已批准" | "已拒絕";

interface ClockEvent {
  time: string;
  location: string;
  note?: string;
  photo: string;
}

interface DayRecord {
  date: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  clockIn?: ClockEvent;
  clockOut?: ClockEvent;
  status: DayStatus;
  correctionId?: string;
}

interface CorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  gender: "男" | "女";
  jobTitle: string;
  store: string;
  date: string;
  type: "上班打卡" | "下班打卡";
  requestedTime: string;
  location: string;
  reason: string;
  photo: string;
  status: CorrectionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

interface HiredEmployee {
  id: string;
  name: string;
  gender: "男" | "女";
  jobTitle: string;
  store: string;
  hiringType: "全職" | "兼職" | "臨時工";
  defaultDays: string[];
  defaultStart: string;
  defaultEnd: string;
}

// ── Clock photo placeholder ────────────────────────────────
const CLOCK_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23e2e8f0'/><stop offset='100%' stop-color='%23cbd5e1'/></linearGradient></defs>
    <rect width='280' height='200' fill='url(%23g)'/>
    <rect x='0' y='148' width='280' height='52' fill='%230f172a' opacity='0.55'/>
    <rect x='20' y='25' width='55' height='75' rx='3' fill='%2394a3b8'/><rect x='30' y='32' width='35' height='20' rx='2' fill='%23cbd5e1'/>
    <rect x='100' y='35' width='75' height='55' rx='3' fill='%2394a3b8'/><rect x='110' y='42' width='55' height='15' rx='2' fill='%23cbd5e1'/>
    <rect x='190' y='20' width='70' height='90' rx='3' fill='%2394a3b8'/><rect x='200' y='28' width='50' height='25' rx='2' fill='%23cbd5e1'/>
    <circle cx='140' cy='110' r='26' fill='%2394a3b8'/>
    <circle cx='140' cy='95' r='15' fill='%23dde3eb'/>
    <ellipse cx='140' cy='148' rx='40' ry='22' fill='%2394a3b8'/>
    <circle cx='252' cy='22' r='14' fill='%23ef4444'/>
    <circle cx='252' cy='22' r='6' fill='white'/>
    <rect x='6' y='6' width='46' height='17' rx='3' fill='%23ef4444' opacity='0.9'/>
    <text x='29' y='18' font-family='sans-serif' font-size='9' fill='white' text-anchor='middle' font-weight='bold'>● LIVE</text>
    <text x='140' y='192' font-family='sans-serif' font-size='11' fill='%23cbd5e1' text-anchor='middle'>打卡現場照片</text>
  </svg>`
);

// ── Helpers ────────────────────────────────────────────────
const WEEKDAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"];

function getWeekdayKey(dateStr: string): string {
  const d = new Date(dateStr).getDay();
  return WEEKDAY_KEYS[d === 0 ? 6 : d - 1];
}

function fmtMonthYear(year: number, month: number): string {
  return `${year}年${month}月`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const prefixEmpty = firstDow === 0 ? 6 : firstDow - 1;
  const days = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(prefixEmpty).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const grid: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) grid.push(cells.slice(i, i + 7));
  return grid;
}

const TODAY_STR = new Date().toISOString().slice(0, 10);

// ── Hired employees ────────────────────────────────────────
const HIRED_EMPLOYEES: HiredEmployee[] = [
  { id: "APP-001", name: "陳大文",  gender: "男", jobTitle: "收銀員",   store: "旺角分店",   hiringType: "兼職",  defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "09:00", defaultEnd: "18:00" },
  { id: "APP-017", name: "劉嘉穎",  gender: "女", jobTitle: "客服代表", store: "中環總部",   hiringType: "全職",  defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "09:00", defaultEnd: "18:00" },
  { id: "APP-007", name: "黃曉恩",  gender: "女", jobTitle: "侍應生",   store: "中環分店",   hiringType: "臨時工", defaultDays: ["fri","sat","sun"], defaultStart: "17:00", defaultEnd: "23:00" },
  { id: "APP-008", name: "林嘉慧",  gender: "女", jobTitle: "侍應生",   store: "中環分店",   hiringType: "臨時工", defaultDays: ["fri","sat","sun"], defaultStart: "17:00", defaultEnd: "23:00" },
  { id: "APP-012", name: "蔡敏儀",  gender: "女", jobTitle: "推廣員",   store: "尖沙咀分店", hiringType: "臨時工", defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "10:00", defaultEnd: "18:00" },
  { id: "APP-013", name: "許志安",  gender: "男", jobTitle: "推廣員",   store: "尖沙咀分店", hiringType: "臨時工", defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "10:00", defaultEnd: "18:00" },
];

// ── Build monthly records ──────────────────────────────────
function buildMonthRecords(
  emp: HiredEmployee,
  year: number,
  month: number,
  exceptions: Record<string, Partial<DayRecord>>
): DayRecord[] {
  const days = getDaysInMonth(year, month);
  const results: DayRecord[] = [];
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const wKey = getWeekdayKey(dateStr);
    const isWork = emp.defaultDays.includes(wKey);
    const isPast = dateStr <= TODAY_STR;
    if (!isWork) { results.push({ date: dateStr, status: "未排班" }); continue; }
    if (!isPast) { results.push({ date: dateStr, scheduledStart: emp.defaultStart, scheduledEnd: emp.defaultEnd, status: "待上班" }); continue; }
    if (exceptions[dateStr]) {
      results.push({ date: dateStr, scheduledStart: emp.defaultStart, scheduledEnd: emp.defaultEnd, ...exceptions[dateStr] } as DayRecord);
      continue;
    }
    results.push({
      date: dateStr, scheduledStart: emp.defaultStart, scheduledEnd: emp.defaultEnd,
      clockIn:  { time: emp.defaultStart, location: emp.store + "附近", photo: CLOCK_PHOTO },
      clockOut: { time: emp.defaultEnd,   location: emp.store + "附近", photo: CLOCK_PHOTO },
      status: "正常",
    });
  }
  return results;
}

// ── Monthly records for current month ─────────────────────
const CUR_YEAR = 2026, CUR_MONTH = 6;

const EXCEPTIONS: Record<string, Record<string, Partial<DayRecord>>> = {
  "APP-001": {
    "2026-06-10": { status: "遲到早退",   clockIn: { time: "09:22", location: "旺角彌敦道 608 號", photo: CLOCK_PHOTO }, clockOut: { time: "18:00", location: "旺角彌敦道 608 號", photo: CLOCK_PHOTO } },
    "2026-06-15": { status: "缺勤" },
    "2026-06-16": { status: "補卡待審核", clockIn: { time: "09:00", location: "旺角彌敦道 608 號", photo: CLOCK_PHOTO }, correctionId: "CORR-001" },
  },
  "APP-017": {
    "2026-06-08": { status: "遲到早退",   clockIn: { time: "10:15", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO }, clockOut: { time: "18:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO } },
    "2026-06-11": { status: "遲到早退",   clockIn: { time: "09:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO }, clockOut: { time: "17:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO } },
    "2026-06-18": { status: "補卡待審核", clockIn: { time: "09:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO }, clockOut: { time: "16:30", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO, note: "早退，補卡申請已提交" }, correctionId: "CORR-002" },
  },
  "APP-007": {
    "2026-06-07": { status: "遲到早退",   clockIn: { time: "17:18", location: "中環皇后大道中 30 號", photo: CLOCK_PHOTO }, clockOut: { time: "23:00", location: "中環皇后大道中 30 號", photo: CLOCK_PHOTO } },
    "2026-06-14": { status: "補卡待審核", clockIn: { time: "17:00", location: "中環皇后大道中 30 號", photo: CLOCK_PHOTO }, correctionId: "CORR-003" },
  },
  "APP-012": {
    "2026-06-16": { status: "遲到早退",   clockIn: { time: "10:23", location: "尖沙咀廣東道 17 號", photo: CLOCK_PHOTO }, clockOut: { time: "18:00", location: "尖沙咀廣東道 17 號", photo: CLOCK_PHOTO } },
  },
  "APP-013": {
    "2026-06-18": { status: "缺勤" },
  },
};

const INITIAL_MONTHLY_RECORDS: Record<string, DayRecord[]> = Object.fromEntries(
  HIRED_EMPLOYEES.map(emp => [emp.id, buildMonthRecords(emp, CUR_YEAR, CUR_MONTH, EXCEPTIONS[emp.id] ?? {})])
);

const INITIAL_CORRECTIONS: CorrectionRequest[] = [
  {
    id: "CORR-001", employeeId: "APP-001", employeeName: "陳大文", gender: "男",
    jobTitle: "收銀員", store: "旺角分店",
    date: "2026-06-16", type: "上班打卡", requestedTime: "09:00", location: "旺角彌敦道 608 號",
    reason: "補卡原因：6月15日（昨日）手機電量耗盡未能打卡，已按時到崗，由同事可作證。申請補打上班打卡。",
    photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-16 09:15",
  },
  {
    id: "CORR-002", employeeId: "APP-017", employeeName: "劉嘉穎", gender: "女",
    jobTitle: "客服代表", store: "中環總部",
    date: "2026-06-18", type: "下班打卡", requestedTime: "18:00", location: "中環皇后大道中 15 號",
    reason: "因家庭緊急事務提早離開，已事先口頭告知主管並獲批准。申請補填排班下班時間 18:00。",
    photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-18 16:40",
  },
  {
    id: "CORR-003", employeeId: "APP-007", employeeName: "黃曉恩", gender: "女",
    jobTitle: "侍應生", store: "中環分店",
    date: "2026-06-14", type: "下班打卡", requestedTime: "23:00", location: "中環皇后大道中 30 號",
    reason: "收工後忙於收尾工作忘記打卡，實際完成工作時間為 23:00，有同事目擊。",
    photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-15 10:30",
  },
];

// ── Day status config ──────────────────────────────────────
const DAY_CFG: Record<DayStatus, {
  bg: string; border: string; dateColor: string;
  label: string; labelColor: string; hasDot?: boolean; dotColor?: string;
}> = {
  "未排班":    { bg: "bg-white",      border: "border-slate-100",  dateColor: "text-slate-300",  label: "",          labelColor: "" },
  "待上班":    { bg: "bg-slate-50",   border: "border-slate-200",  dateColor: "text-slate-500",  label: "排班中",    labelColor: "text-slate-400" },
  "正常":      { bg: "bg-green-50",   border: "border-green-200",  dateColor: "text-green-800",  label: "正常",      labelColor: "text-green-600" },
  "遲到早退":  { bg: "bg-amber-50",   border: "border-amber-200",  dateColor: "text-amber-900",  label: "遲到早退",  labelColor: "text-amber-700" },
  "缺勤":      { bg: "bg-red-50",     border: "border-red-200",    dateColor: "text-red-800",    label: "缺勤",      labelColor: "text-red-600" },
  "補卡待審核": { bg: "bg-violet-50", border: "border-violet-300", dateColor: "text-violet-900", label: "補卡待審核", labelColor: "text-violet-700", hasDot: true, dotColor: "bg-violet-500" },
  "已補卡":    { bg: "bg-teal-50",    border: "border-teal-200",   dateColor: "text-teal-800",   label: "已補卡",    labelColor: "text-teal-600" },
};

// ── Avatar colors ──────────────────────────────────────────
const AVATAR_COLORS = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-rose-100 text-rose-700","bg-amber-100 text-amber-700","bg-cyan-100 text-cyan-700"];
function avatarColor(id: string) { return AVATAR_COLORS[parseInt(id.replace("APP-",""),10) % AVATAR_COLORS.length]; }

// ── Compute summary stats ──────────────────────────────────
function toM(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

function computeStats(records: DayRecord[], corrections: CorrectionRequest[]) {
  const corrMap = new Map(corrections.map(c => [c.id, c.status]));
  const eff = (r: DayRecord): DayStatus => {
    if (r.correctionId && corrMap.get(r.correctionId) === "已批准") return "已補卡";
    return r.status;
  };
  const past    = records.filter(r => r.status !== "未排班" && r.status !== "待上班");
  const total   = records.filter(r => r.scheduledStart).length;
  const normal  = past.filter(r => ["正常","已補卡"].includes(eff(r))).length;
  const abnormal = past.filter(r => ["遲到早退","缺勤"].includes(eff(r))).length;
  const pending  = past.filter(r => eff(r) === "補卡待審核").length;
  const rate     = past.length > 0 ? Math.round(normal / past.length * 100) : 100;
  const scheduledHours = past.reduce((s, r) => {
    if (!r.scheduledStart || !r.scheduledEnd) return s;
    return s + (toM(r.scheduledEnd) - toM(r.scheduledStart)) / 60;
  }, 0);
  const actualHours = past.reduce((s, r) => {
    if (!r.clockIn?.time || !r.clockOut?.time) return s;
    return s + Math.max(0, (toM(r.clockOut.time) - toM(r.clockIn.time)) / 60);
  }, 0);
  return {
    total, pastDays: past.length, normal, abnormal, pending, rate,
    scheduledHours: Math.round(scheduledHours * 10) / 10,
    actualHours:    Math.round(actualHours    * 10) / 10,
  };
}

// ── Day cell in calendar ───────────────────────────────────
function DayCell({ day, record, isSelected, isToday, effectiveStatus, onClick }: {
  day: number; record?: DayRecord; isSelected: boolean;
  isToday: boolean; effectiveStatus: DayStatus; onClick: () => void;
}) {
  const cfg = DAY_CFG[effectiveStatus];
  const isClickable = effectiveStatus !== "未排班";

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        w-full h-[68px] rounded-xl border text-left p-2 transition-all relative overflow-hidden
        ${cfg.bg} ${cfg.border}
        ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 shadow-sm" : ""}
        ${isToday && !isSelected ? "ring-1 ring-blue-300" : ""}
        ${isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-30"}
      `}
    >
      <div className="flex items-start justify-between">
        <span className={`text-sm font-semibold leading-none ${cfg.dateColor} ${isToday ? "underline" : ""}`}>{day}</span>
        {cfg.hasDot && (
          <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${cfg.dotColor}`} />
        )}
      </div>
      {cfg.label && (
        <div className={`text-[10px] font-medium mt-1.5 leading-none ${cfg.labelColor}`}>{cfg.label}</div>
      )}
      {record?.scheduledStart && effectiveStatus === "待上班" && (
        <div className="text-[9px] text-slate-400 mt-1 leading-none tabular-nums">{record.scheduledStart}–{record.scheduledEnd}</div>
      )}
    </button>
  );
}

// ── Clock block in day detail ──────────────────────────────
function ClockBlock({ label, event, scheduled, lightboxTitle }: {
  label: string; event?: ClockEvent; scheduled?: string; lightboxTitle: string;
}) {
  const [lightbox, setLightbox] = useState(false);
  if (!event) {
    return (
      <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
        <div className="text-xs text-slate-400">未打卡</div>
        {scheduled && <div className="text-xs text-slate-400 mt-0.5">排班：{scheduled}</div>}
      </div>
    );
  }
  return (
    <div className="flex-1 p-3 bg-white rounded-xl border border-slate-100">
      <div className="text-xs font-medium text-slate-600 mb-2">{label}</div>
      <div className="relative h-20 rounded-lg overflow-hidden bg-slate-100 mb-2 cursor-pointer group" onClick={() => setLightbox(true)}>
        <img src={event.photo} alt="打卡照片" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900 tabular-nums">{event.time}</span>
          {scheduled && <span className="text-slate-400">（排班 {scheduled}）</span>}
        </div>
        <div className="flex items-start gap-1 text-xs text-slate-600">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" /><span>{event.location}</span>
        </div>
        {event.note && <div className="text-xs text-slate-400 italic">{event.note}</div>}
      </div>
      {lightbox && (
        <Dialog open onOpenChange={() => setLightbox(false)}>
          <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <DialogTitle className="text-sm font-semibold text-slate-900">{lightboxTitle}</DialogTitle>
              <DialogDescription className="sr-only">打卡照片預覽</DialogDescription>
            </div>
            <div className="bg-slate-50 p-4 flex items-center justify-center">
              <img src={event.photo} alt="打卡照片" className="max-w-full max-h-[360px] rounded-lg object-contain" />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setLightbox(false)} className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">關閉</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Employee calendar panel (right drawer) ─────────────────
function EmployeeCalendarPanel({ employee, monthlyRecords, corrections, onClose, onApprove, onReject }: {
  employee: HiredEmployee;
  monthlyRecords: DayRecord[];
  corrections: CorrectionRequest[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [viewYear, setViewYear] = useState(CUR_YEAR);
  const [viewMonth, setViewMonth] = useState(CUR_MONTH);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectStep, setRejectStep] = useState(false);

  const corrMap = new Map(corrections.map(c => [c.id, c]));
  const effectiveStatus = (r: DayRecord): DayStatus => {
    if (r.correctionId && corrMap.get(r.correctionId)?.status === "已批准") return "已補卡";
    return r.status;
  };

  const getRecord = (day: number): DayRecord | undefined =>
    monthlyRecords.find(r => r.date === `${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`);

  const grid = getCalendarGrid(viewYear, viewMonth);
  const stats = computeStats(monthlyRecords, corrections);

  const selectedRecord = selectedDay ? getRecord(selectedDay) : undefined;
  const selectedEffective = selectedRecord ? effectiveStatus(selectedRecord) : undefined;
  const selectedCorr = selectedRecord?.correctionId ? corrMap.get(selectedRecord.correctionId) : undefined;

  const todayDay = TODAY_STR.startsWith(`${viewYear}-${String(viewMonth).padStart(2,"0")}`)
    ? parseInt(TODAY_STR.slice(-2), 10) : null;

  const WDAY_LABELS = ["一","二","三","四","五","六","日"];

  return (
    <>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[780px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">

        {/* Panel header */}
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${avatarColor(employee.id)}`}>
                {employee.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">{employee.name}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${employee.gender === "女" ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>{employee.gender}</span>
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{employee.jobTitle} · {employee.store} · {employee.hiringType}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "本月應出勤", value: `${stats.pastDays}天`, color: "text-slate-900" },
              { label: "考勤正常",   value: `${stats.normal}天`,   color: "text-green-700" },
              { label: "考勤異常",   value: `${stats.abnormal}天`, color: stats.abnormal > 0 ? "text-amber-700" : "text-slate-400" },
              { label: "補卡待審核", value: `${stats.pending}件`,  color: stats.pending > 0  ? "text-violet-700" : "text-slate-400" },
              { label: "出勤率",     value: `${stats.rate}%`,      color: stats.rate >= 90 ? "text-green-700" : stats.rate >= 75 ? "text-amber-700" : "text-red-600" },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-lg px-3 py-2.5 text-center border border-slate-100">
                <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Month navigator */}
          <div className="px-6 pt-5 flex items-center justify-between mb-4">
            <button
              onClick={() => { if (viewMonth === 1) { setViewMonth(12); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="font-semibold text-slate-900 text-sm">{fmtMonthYear(viewYear, viewMonth)}</div>
            <button
              onClick={() => { if (viewMonth === 12) { setViewMonth(1); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Calendar */}
          <div className="px-6">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WDAY_LABELS.map(l => (
                <div key={l} className={`text-center text-xs font-semibold py-1 ${l === "六" || l === "日" ? "text-rose-400" : "text-slate-400"}`}>{l}</div>
              ))}
            </div>
            {/* Day rows */}
            {grid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1.5 mb-1.5">
                {row.map((day, ci) => {
                  if (!day) return <div key={ci} className="h-[68px]" />;
                  const rec = getRecord(day);
                  const effStatus = rec ? effectiveStatus(rec) : "未排班";
                  return (
                    <DayCell
                      key={ci}
                      day={day}
                      record={rec}
                      isSelected={selectedDay === day}
                      isToday={day === todayDay}
                      effectiveStatus={effStatus}
                      onClick={() => {
                        setSelectedDay(selectedDay === day ? null : day);
                        setRejectStep(false);
                        setRejectNote("");
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 mb-5 text-[10px] text-slate-400 flex-wrap">
              {(["正常","遲到早退","缺勤","補卡待審核","已補卡","未排班"] as DayStatus[]).map(s => (
                <span key={s} className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded border shrink-0 ${DAY_CFG[s].bg} ${DAY_CFG[s].border}`} />
                  {s || "未排班"}
                </span>
              ))}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDay && selectedRecord && selectedEffective && selectedEffective !== "未排班" && selectedEffective !== "待上班" && (
            <div className="mx-6 mb-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-800">
                  {viewMonth}月{selectedDay}日 打卡詳情
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${DAY_CFG[selectedEffective].bg} ${DAY_CFG[selectedEffective].border} ${DAY_CFG[selectedEffective].labelColor}`}>
                  {DAY_CFG[selectedEffective].label}
                </span>
              </div>

              {/* Clock events */}
              <div className="flex gap-3 mb-4">
                <ClockBlock label="上班打卡" event={selectedRecord.clockIn}  scheduled={selectedRecord.scheduledStart} lightboxTitle="上班打卡照片" />
                <ClockBlock label="下班打卡" event={selectedRecord.clockOut} scheduled={selectedRecord.scheduledEnd}   lightboxTitle="下班打卡照片" />
              </div>

              {/* Correction request (if any) */}
              {selectedCorr && (
                <div className={`rounded-xl border p-4 ${selectedCorr.status === "待審核" ? "bg-violet-50 border-violet-200" : selectedCorr.status === "已批准" ? "bg-teal-50 border-teal-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5" />補卡申請
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${selectedCorr.status === "待審核" ? "bg-violet-100 text-violet-700 border-violet-300" : selectedCorr.status === "已批准" ? "bg-teal-100 text-teal-700 border-teal-300" : "bg-red-100 text-red-600 border-red-300"}`}>
                      {selectedCorr.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-1">
                    補 {selectedCorr.type} · 申請時間 {selectedCorr.requestedTime}
                  </div>
                  <div className="text-xs text-slate-700 bg-white/60 rounded-lg p-2.5 mb-3 leading-relaxed border border-white/80">
                    {selectedCorr.reason}
                  </div>
                  {selectedCorr.status === "待審核" && !rejectStep && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs h-8 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setRejectStep(true)}>
                        <XCircle className="w-3.5 h-3.5 mr-1" />拒絕
                      </Button>
                      <Button className="flex-1 text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { onApprove(selectedCorr.id); }}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />批准補卡
                      </Button>
                    </div>
                  )}
                  {selectedCorr.status === "待審核" && rejectStep && (
                    <div className="space-y-2">
                      <textarea rows={2} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                        placeholder="請填寫拒絕原因…"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => setRejectStep(false)}>返回</Button>
                        <Button className="flex-1 text-xs h-8 bg-red-600 hover:bg-red-700 text-white" onClick={() => { onReject(selectedCorr.id, rejectNote); setRejectStep(false); }}>確認拒絕</Button>
                      </div>
                    </div>
                  )}
                  {selectedCorr.status !== "待審核" && selectedCorr.reviewNote && (
                    <div className="text-xs text-slate-600 bg-white/60 rounded p-2 border border-white/80">{selectedCorr.reviewNote}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Correction review panel ────────────────────────────────
function CorrectionReviewPanel({ request, onClose, onApprove, onReject }: {
  request: CorrectionRequest; onClose: () => void;
  onApprove: (id: string) => void; onReject: (id: string, note: string) => void;
}) {
  const [step, setStep] = useState<"view" | "reject">("view");
  const [note, setNote] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const CORR_CFG = { "待審核": "bg-amber-50 border-amber-200 text-amber-700", "已批准": "bg-teal-50 border-teal-200 text-teal-700", "已拒絕": "bg-red-50 border-red-200 text-red-600" };
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[440px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${CORR_CFG[request.status]}`}>{request.status}</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">補卡申請審核</h2>
            <div className="text-sm text-slate-500 mt-0.5">{request.employeeName} · {request.jobTitle} · {request.date}</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 text-sm ${avatarColor(request.employeeId)}`}>{request.employeeName[0]}</div>
            <div><div className="font-medium text-slate-900 text-sm">{request.employeeName}</div><div className="text-xs text-slate-500 mt-0.5">{request.gender} · {request.jobTitle} · {request.store}</div></div>
          </div>
          <div className="space-y-2">
            {[["補卡類型", request.type],["申請時間", request.requestedTime],["打卡地點", request.location],["提交時間", request.submittedAt]].map(([l,v]) => (
              <div key={l} className="flex gap-4"><span className="text-xs text-slate-400 w-16 shrink-0 pt-0.5">{l}</span><span className="text-sm text-slate-800 font-medium">{v}</span></div>
            ))}
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1.5">申請原因</div>
            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{request.reason}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1.5">補卡照片</div>
            <div className="relative h-32 rounded-xl overflow-hidden cursor-pointer group" onClick={() => setLightbox(true)}>
              <img src={request.photo} alt="補卡照片" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
          {request.reviewedAt && <div className={`rounded-xl p-3 border text-sm ${request.status === "已批准" ? "bg-teal-50 border-teal-200 text-teal-800" : "bg-red-50 border-red-200 text-red-700"}`}>
            <div className="font-semibold mb-1">{request.status === "已批准" ? "✓ 已批准" : "✕ 已拒絕"} · {request.reviewedAt}</div>
            {request.reviewNote && <div className="text-xs opacity-80">{request.reviewNote}</div>}
          </div>}
          {step === "reject" && <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-500">拒絕原因</div>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="請說明拒絕原因…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>}
        </div>
        {request.status === "待審核" && (
          <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
            {step === "view" ? (
              <><Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
              <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setStep("reject")}><XCircle className="w-4 h-4 mr-1.5" />拒絕</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { onApprove(request.id); onClose(); }}><CheckCircle2 className="w-4 h-4 mr-1.5" />批准補卡</Button></>
            ) : (
              <><Button variant="outline" className="flex-1" onClick={() => setStep("view")}>返回</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { onReject(request.id, note); onClose(); }}>確認拒絕</Button></>
            )}
          </div>
        )}
        {lightbox && (
          <Dialog open onOpenChange={() => setLightbox(false)}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <DialogTitle className="text-sm font-semibold text-slate-900">補卡照片</DialogTitle>
                <DialogDescription className="sr-only">補卡照片預覽</DialogDescription>
              </div>
              <div className="bg-slate-50 p-4 flex items-center justify-center">
                <img src={request.photo} alt="補卡照片" className="max-w-full max-h-[360px] rounded-lg object-contain" />
              </div>
              <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
                <button onClick={() => setLightbox(false)} className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors">關閉</button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────
export function AttendancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "corrections">("overview");
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(INITIAL_CORRECTIONS);
  const [search, setSearch] = useState("");
  const [overviewDisplay, setOverviewDisplay] = useState<"summary" | "detail">("summary");
  const [corrFilter, setCorrFilter] = useState("all");
  const [reviewTarget, setReviewTarget] = useState<CorrectionRequest | null>(null);

  const pendingCount = corrections.filter(c => c.status === "待審核").length;

  const handleApprove = (id: string) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: "已批准", reviewedAt: now, reviewNote: "補卡已批准" } : c));
  };
  const handleReject = (id: string, note: string) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: "已拒絕", reviewedAt: now, reviewNote: note } : c));
  };

  const filteredEmployees = HIRED_EMPLOYEES.filter(e =>
    !search || e.name.includes(search) || e.jobTitle.includes(search)
  );

  const allStats = HIRED_EMPLOYEES.map(emp => ({
    emp,
    stats: computeStats(INITIAL_MONTHLY_RECORDS[emp.id] ?? [], corrections),
  }));

  const totalNormal  = allStats.reduce((s, x) => s + x.stats.normal, 0);
  const totalPast    = allStats.reduce((s, x) => s + x.stats.pastDays, 0);
  const overallRate  = totalPast > 0 ? Math.round(totalNormal / totalPast * 100) : 100;
  const hasAction    = allStats.filter(x => x.stats.pending > 0 || x.stats.abnormal > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div><h1 className="text-xl font-semibold text-slate-900">考勤管理</h1><p className="text-sm text-slate-500 mt-0.5">按員工查看月度考勤狀況及補卡審核</p></div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "本月在職人數",    value: HIRED_EMPLOYEES.length,                                                          sub: "目前在職",     color: "bg-white border-slate-200 text-slate-900" },
              { label: "整體出勤率",      value: `${overallRate}%`,                                                               sub: "本月至今",     color: overallRate >= 90 ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800" },
              { label: "有考勤異常",      value: `${allStats.filter(x => x.stats.abnormal > 0).length} 人`,                       sub: "遲到早退或缺勤", color: "bg-amber-50 border-amber-200 text-amber-800" },
              { label: "補卡待審核",      value: `${pendingCount} 件`,                                                            sub: "需要審核",     color: pendingCount > 0 ? "bg-violet-50 border-violet-200 text-violet-800" : "bg-white border-slate-200 text-slate-900" },
            ].map(c => (
              null
            ))}
          </div>

          {/* Tabs + display toggle */}
          <div className="flex items-center justify-between mb-5 border-b border-slate-200">
            <div className="flex items-center gap-1">
              {([
                { key: "overview",    label: "考勤總覽",  count: hasAction },
                { key: "corrections", label: "補卡審核",  count: pendingCount },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium relative transition-colors ${activeTab === tab.key ? "text-blue-700" : "text-slate-500 hover:text-slate-700"}`}>
                  {tab.label}
                  {tab.count > 0 && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>{tab.count}</span>}
                  {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
                </button>
              ))}
            </div>
            {activeTab === "overview" && (
              <div className="flex bg-slate-100 rounded-lg p-0.5 mb-1">
                <button onClick={() => setOverviewDisplay("summary")} title="月度彙總"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${overviewDisplay === "summary" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <BarChart2 className="w-3.5 h-3.5" />月度彙總
                </button>
                <button onClick={() => setOverviewDisplay("detail")} title="每日明細"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${overviewDisplay === "detail" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <LayoutList className="w-3.5 h-3.5" />每日明細
                </button>
              </div>
            )}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === "overview" && (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋員工姓名或職位…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                </div>
              </div>

              {/* Monthly summary view */}
              {overviewDisplay === "summary" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm" style={{ minWidth: "1000px" }}>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left w-[160px]">員工</th>
                        <th className="px-4 py-3 text-left w-[120px]">職位 / 門店</th>
                        <th className="px-4 py-3 text-center w-[80px]">應出勤</th>
                        <th className="px-4 py-3 text-center w-[80px]">正常天數</th>
                        <th className="px-4 py-3 text-center w-[80px]">異常天數</th>
                        <th className="px-4 py-3 text-center w-[90px]">應出勤工時</th>
                        <th className="px-4 py-3 text-center w-[90px]">實際工時</th>
                        <th className="px-4 py-3 text-center w-[80px]">補卡</th>
                        <th className="px-4 py-3 text-left w-[130px]">出勤率</th>
                        <th className="px-4 py-3 text-left w-[90px]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr><td colSpan={10} className="py-14 text-center text-sm text-slate-400">暫無符合的員工</td></tr>
                      ) : filteredEmployees.map(emp => {
                        const { stats } = allStats.find(x => x.emp.id === emp.id)!;
                        const needsAttention = stats.abnormal > 0 || stats.pending > 0;
                        return (
                          <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(emp.id)}`}>{emp.name[0]}</div>
                                <div>
                                  <div className="font-medium text-slate-900 flex items-center gap-1.5">
                                    {emp.name}
                                    {needsAttention && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5">{emp.gender}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-sm text-slate-700">{emp.jobTitle}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{emp.store}</div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-sm font-medium text-slate-900">{stats.pastDays}</span>
                              <span className="text-xs text-slate-400 ml-0.5">天</span>
                            </td>
                            <td className="px-4 py-3.5 text-center"><span className="text-sm font-medium text-green-700">{stats.normal}</span></td>
                            <td className="px-4 py-3.5 text-center"><span className={`text-sm font-semibold ${stats.abnormal > 0 ? "text-amber-600" : "text-slate-400"}`}>{stats.abnormal}</span></td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-sm font-medium text-slate-700 tabular-nums">{stats.scheduledHours}</span>
                              <span className="text-xs text-slate-400 ml-0.5">h</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`text-sm font-semibold tabular-nums ${stats.actualHours < stats.scheduledHours * 0.9 ? "text-amber-600" : "text-slate-900"}`}>{stats.actualHours}</span>
                              <span className="text-xs text-slate-400 ml-0.5">h</span>
                            </td>
                            <td className="px-4 py-3.5 text-center"><span className={`text-sm font-semibold ${stats.pending > 0 ? "text-violet-600" : "text-slate-400"}`}>{stats.pending}</span></td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${stats.rate >= 90 ? "bg-green-500" : stats.rate >= 75 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${stats.rate}%` }} />
                                </div>
                                <span className={`text-xs font-medium w-9 shrink-0 tabular-nums ${stats.rate >= 90 ? "text-green-700" : stats.rate >= 75 ? "text-amber-700" : "text-red-600"}`}>{stats.rate}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <button onClick={() => navigate(`/attendance-employee?id=${emp.id}`)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                                <Calendar className="w-3 h-3" />月曆
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Daily detail view placeholder — redirect to employee page */}
              {overviewDisplay === "detail" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                  <p className="text-sm text-slate-500 mb-4">每日打卡明細請選擇員工後查看月曆詳情</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {filteredEmployees.map(emp => (
                      <button key={emp.id} onClick={() => navigate(`/attendance-employee?id=${emp.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(emp.id)}`}>{emp.name[0]}</div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-400">{emp.jobTitle}</div>
                        </div>
                        <Calendar className="w-3.5 h-3.5 text-blue-500 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Corrections tab ── */}
          {activeTab === "corrections" && (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="relative">
                  <select value={corrFilter} onChange={e => setCorrFilter(e.target.value)}
                    className={`h-8 pl-3 pr-7 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors ${corrFilter !== "all" ? "border-blue-400 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600"}`}>
                    <option value="all">全部狀態</option>
                    <option value="待審核">待審核</option>
                    <option value="已批准">已批准</option>
                    <option value="已拒絕">已拒絕</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm" style={{ minWidth: "760px" }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-[140px]">員工</th>
                      <th className="px-4 py-3 text-left w-[100px]">補卡日期</th>
                      <th className="px-4 py-3 text-left w-[90px]">補卡類型</th>
                      <th className="px-4 py-3 text-left w-[90px]">申請時間</th>
                      <th className="px-4 py-3 text-left w-[220px]">申請原因摘要</th>
                      <th className="px-4 py-3 text-left w-[90px]">狀態</th>
                      <th className="px-4 py-3 text-left w-[80px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.filter(c => corrFilter === "all" || c.status === corrFilter).length === 0 ? (
                      <tr><td colSpan={7} className="py-14 text-center text-slate-400 text-sm">暫無補卡申請記錄</td></tr>
                    ) : corrections.filter(c => corrFilter === "all" || c.status === corrFilter).map(c => {
                      const CORR_CFG = { "待審核": "bg-amber-50 text-amber-700 border-amber-200", "已批准": "bg-teal-50 text-teal-700 border-teal-200", "已拒絕": "bg-red-50 text-red-600 border-red-200" };
                      return (
                        <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(c.employeeId)}`}>{c.employeeName[0]}</div>
                              <div><div className="font-medium text-slate-900">{c.employeeName}</div><div className="text-xs text-slate-400">{c.jobTitle}</div></div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-700 tabular-nums">{c.date}</td>
                          <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-medium">{c.type}</span></td>
                          <td className="px-4 py-3.5 text-sm text-slate-700 tabular-nums">{c.requestedTime}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 truncate max-w-[220px]">{c.reason.slice(0, 40)}…</td>
                          <td className="px-4 py-3.5"><span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${CORR_CFG[c.status]}`}>{c.status}</span></td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => setReviewTarget(c)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${c.status === "待審核" ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                              {c.status === "待審核" ? <><ClipboardCheck className="w-3 h-3" />審核</> : <><FileText className="w-3 h-3" />查看</>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Correction review panel */}
      {reviewTarget && (
        <CorrectionReviewPanel
          request={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
