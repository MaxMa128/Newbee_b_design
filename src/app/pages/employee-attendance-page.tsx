import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin,
  Image, ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, X,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

// ── Re-use shared types & data from attendance-page ────────
// (Defined locally to avoid circular imports)
type DayStatus = "未排班" | "待上班" | "正常" | "遲到早退" | "缺勤" | "補卡待審核" | "已補卡";
type CorrectionStatus = "待審核" | "已批准" | "已拒絕";

interface ClockEvent { time: string; location: string; note?: string; photo: string; }
interface DayRecord {
  date: string; scheduledStart?: string; scheduledEnd?: string;
  clockIn?: ClockEvent; clockOut?: ClockEvent;
  status: DayStatus; correctionId?: string;
}
interface CorrectionRequest {
  id: string; employeeId: string; employeeName: string;
  date: string; type: "上班打卡" | "下班打卡"; requestedTime: string;
  location: string; reason: string; photo: string;
  status: CorrectionStatus; submittedAt: string;
  reviewedAt?: string; reviewNote?: string;
}
interface HiredEmployee {
  id: string; name: string; gender: "男" | "女";
  jobTitle: string; store: string; hiringType: "全職" | "兼職" | "臨時工";
  defaultDays: string[]; defaultStart: string; defaultEnd: string;
}

// ── Clock photo placeholder ────────────────────────────────
const CLOCK_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23e2e8f0'/><stop offset='100%' stop-color='%23cbd5e1'/></linearGradient></defs>
    <rect width='280' height='200' fill='url(%23g)'/>
    <rect x='0' y='148' width='280' height='52' fill='%230f172a' opacity='0.55'/>
    <circle cx='140' cy='110' r='26' fill='%2394a3b8'/><circle cx='140' cy='95' r='15' fill='%23dde3eb'/>
    <ellipse cx='140' cy='148' rx='40' ry='22' fill='%2394a3b8'/>
    <rect x='6' y='6' width='46' height='17' rx='3' fill='%23ef4444' opacity='0.9'/>
    <text x='29' y='18' font-family='sans-serif' font-size='9' fill='white' text-anchor='middle' font-weight='bold'>● LIVE</text>
    <text x='140' y='192' font-family='sans-serif' font-size='11' fill='%23cbd5e1' text-anchor='middle'>打卡現場照片</text>
  </svg>`
);

// ── Shared data (mirrors attendance-page.tsx) ──────────────
const TODAY_STR = new Date().toISOString().slice(0, 10);
const CUR_YEAR = 2026, CUR_MONTH = 6;
const WEEKDAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"];

const HIRED_EMPLOYEES: HiredEmployee[] = [
  { id: "APP-001", name: "陳大文",  gender: "男", jobTitle: "收銀員",   store: "旺角分店",   hiringType: "兼職",   defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "09:00", defaultEnd: "18:00" },
  { id: "APP-017", name: "劉嘉穎",  gender: "女", jobTitle: "客服代表", store: "中環總部",   hiringType: "全職",   defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "09:00", defaultEnd: "18:00" },
  { id: "APP-007", name: "黃曉恩",  gender: "女", jobTitle: "侍應生",   store: "中環分店",   hiringType: "臨時工", defaultDays: ["fri","sat","sun"], defaultStart: "17:00", defaultEnd: "23:00" },
  { id: "APP-008", name: "林嘉慧",  gender: "女", jobTitle: "侍應生",   store: "中環分店",   hiringType: "臨時工", defaultDays: ["fri","sat","sun"], defaultStart: "17:00", defaultEnd: "23:00" },
  { id: "APP-012", name: "蔡敏儀",  gender: "女", jobTitle: "推廣員",   store: "尖沙咀分店", hiringType: "臨時工", defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "10:00", defaultEnd: "18:00" },
  { id: "APP-013", name: "許志安",  gender: "男", jobTitle: "推廣員",   store: "尖沙咀分店", hiringType: "臨時工", defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "10:00", defaultEnd: "18:00" },
];

function getWeekdayKey(dateStr: string): string {
  const d = new Date(dateStr).getDay();
  return WEEKDAY_KEYS[d === 0 ? 6 : d - 1];
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function fmtMonthYear(y: number, m: number) { return `${y}年${m}月`; }
function getCalendarGrid(y: number, m: number): (number | null)[][] {
  const firstDow = new Date(y, m - 1, 1).getDay();
  const prefix = firstDow === 0 ? 6 : firstDow - 1;
  const days = getDaysInMonth(y, m);
  const cells: (number | null)[] = [...Array(prefix).fill(null), ...Array.from({length: days}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const grid: (number|null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) grid.push(cells.slice(i, i+7));
  return grid;
}

function buildMonthRecords(emp: HiredEmployee, y: number, m: number, exc: Record<string, Partial<DayRecord>>): DayRecord[] {
  const days = getDaysInMonth(y, m);
  return Array.from({length: days}, (_, i) => {
    const d = i + 1;
    const dateStr = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isWork = emp.defaultDays.includes(getWeekdayKey(dateStr));
    const isPast = dateStr <= TODAY_STR;
    if (!isWork) return { date: dateStr, status: "未排班" as DayStatus };
    if (!isPast) return { date: dateStr, scheduledStart: emp.defaultStart, scheduledEnd: emp.defaultEnd, status: "待上班" as DayStatus };
    if (exc[dateStr]) return { date: dateStr, scheduledStart: emp.defaultStart, scheduledEnd: emp.defaultEnd, ...exc[dateStr] } as DayRecord;
    return { date: dateStr, scheduledStart: emp.defaultStart, scheduledEnd: emp.defaultEnd, clockIn: { time: emp.defaultStart, location: emp.store + "附近", photo: CLOCK_PHOTO }, clockOut: { time: emp.defaultEnd, location: emp.store + "附近", photo: CLOCK_PHOTO }, status: "正常" as DayStatus };
  });
}

const EXCEPTIONS: Record<string, Record<string, Partial<DayRecord>>> = {
  "APP-001": { "2026-06-10": { status: "遲到早退", clockIn: { time: "09:22", location: "旺角彌敦道 608 號", photo: CLOCK_PHOTO }, clockOut: { time: "18:00", location: "旺角彌敦道 608 號", photo: CLOCK_PHOTO } }, "2026-06-15": { status: "缺勤" }, "2026-06-16": { status: "補卡待審核", clockIn: { time: "09:00", location: "旺角彌敦道 608 號", photo: CLOCK_PHOTO }, correctionId: "CORR-001" } },
  "APP-017": { "2026-06-08": { status: "遲到早退", clockIn: { time: "10:15", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO }, clockOut: { time: "18:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO } }, "2026-06-11": { status: "遲到早退", clockIn: { time: "09:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO }, clockOut: { time: "17:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO } }, "2026-06-18": { status: "補卡待審核", clockIn: { time: "09:00", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO }, clockOut: { time: "16:30", location: "中環皇后大道中 15 號", photo: CLOCK_PHOTO, note: "早退，補卡申請已提交" }, correctionId: "CORR-002" } },
  "APP-007": { "2026-06-07": { status: "遲到早退", clockIn: { time: "17:18", location: "中環皇后大道中 30 號", photo: CLOCK_PHOTO }, clockOut: { time: "23:00", location: "中環皇后大道中 30 號", photo: CLOCK_PHOTO } }, "2026-06-14": { status: "補卡待審核", clockIn: { time: "17:00", location: "中環皇后大道中 30 號", photo: CLOCK_PHOTO }, correctionId: "CORR-003" } },
  "APP-012": { "2026-06-16": { status: "遲到早退", clockIn: { time: "10:23", location: "尖沙咀廣東道 17 號", photo: CLOCK_PHOTO }, clockOut: { time: "18:00", location: "尖沙咀廣東道 17 號", photo: CLOCK_PHOTO } } },
  "APP-013": { "2026-06-18": { status: "缺勤" } },
};

const INITIAL_CORRECTIONS: CorrectionRequest[] = [
  { id: "CORR-001", employeeId: "APP-001", employeeName: "陳大文", date: "2026-06-16", type: "上班打卡", requestedTime: "09:00", location: "旺角彌敦道 608 號", reason: "補卡原因：6月15日手機電量耗盡未能打卡，已按時到崗，由同事可作證。申請補打上班打卡。", photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-16 09:15" },
  { id: "CORR-002", employeeId: "APP-017", employeeName: "劉嘉穎", date: "2026-06-18", type: "下班打卡", requestedTime: "18:00", location: "中環皇后大道中 15 號", reason: "因家庭緊急事務提早離開，已事先口頭告知主管並獲批准。申請補填排班下班時間 18:00。", photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-18 16:40" },
  { id: "CORR-003", employeeId: "APP-007", employeeName: "黃曉恩", date: "2026-06-14", type: "下班打卡", requestedTime: "23:00", location: "中環皇后大道中 30 號", reason: "收工後忙於收尾工作忘記打卡，實際完成工作時間為 23:00。", photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-15 10:30" },
];

// ── Status config ──────────────────────────────────────────
const DAY_CFG: Record<DayStatus, { bg: string; border: string; dateColor: string; label: string; labelColor: string; hasDot?: boolean; dotColor?: string; }> = {
  "未排班":    { bg: "bg-white",      border: "border-slate-100",  dateColor: "text-slate-300",  label: "",          labelColor: "" },
  "待上班":    { bg: "bg-slate-50",   border: "border-slate-200",  dateColor: "text-slate-500",  label: "排班中",    labelColor: "text-slate-400" },
  "正常":      { bg: "bg-green-50",   border: "border-green-200",  dateColor: "text-green-800",  label: "正常",      labelColor: "text-green-600" },
  "遲到早退":  { bg: "bg-amber-50",   border: "border-amber-200",  dateColor: "text-amber-900",  label: "遲到早退",  labelColor: "text-amber-700" },
  "缺勤":      { bg: "bg-red-50",     border: "border-red-200",    dateColor: "text-red-800",    label: "缺勤",      labelColor: "text-red-600" },
  "補卡待審核": { bg: "bg-violet-50", border: "border-violet-300", dateColor: "text-violet-900", label: "補卡待審核", labelColor: "text-violet-700", hasDot: true, dotColor: "bg-violet-500" },
  "已補卡":    { bg: "bg-teal-50",    border: "border-teal-200",   dateColor: "text-teal-800",   label: "已補卡",    labelColor: "text-teal-600" },
};

const AVATAR_COLORS = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-rose-100 text-rose-700","bg-amber-100 text-amber-700","bg-cyan-100 text-cyan-700"];
function avatarColor(id: string) { return AVATAR_COLORS[parseInt(id.replace("APP-",""),10) % AVATAR_COLORS.length]; }

// ── Day cell ───────────────────────────────────────────────
function DayCell({ day, record, isSelected, isToday, effectiveStatus, onClick }: {
  day: number; record?: DayRecord; isSelected: boolean; isToday: boolean; effectiveStatus: DayStatus; onClick: () => void;
}) {
  const cfg = DAY_CFG[effectiveStatus];
  const isClickable = effectiveStatus !== "未排班";
  return (
    <button onClick={onClick} disabled={!isClickable} className={`w-full h-[72px] rounded-xl border text-left p-2 transition-all relative overflow-hidden ${cfg.bg} ${cfg.border} ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 shadow-sm" : ""} ${isToday && !isSelected ? "ring-1 ring-blue-300" : ""} ${isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-30"}`}>
      <div className="flex items-start justify-between">
        <span className={`text-sm font-semibold leading-none ${cfg.dateColor} ${isToday ? "underline" : ""}`}>{day}</span>
        {cfg.hasDot && <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${cfg.dotColor}`} />}
      </div>
      {cfg.label && <div className={`text-[10px] font-medium mt-1.5 leading-none ${cfg.labelColor}`}>{cfg.label}</div>}
      {record?.scheduledStart && effectiveStatus === "待上班" && (
        <div className="text-[9px] text-slate-400 mt-1 leading-none tabular-nums">{record.scheduledStart}–{record.scheduledEnd}</div>
      )}
    </button>
  );
}

// ── Clock block ────────────────────────────────────────────
function ClockBlock({ label, event, scheduled }: { label: string; event?: ClockEvent; scheduled?: string }) {
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
      <div className="relative h-24 rounded-lg overflow-hidden bg-slate-100 mb-2 cursor-pointer group" onClick={() => setLightbox(true)}>
        <img src={event.photo} alt="打卡照片" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Image className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3 text-slate-400" /><span className="font-semibold text-slate-900 tabular-nums">{event.time}</span>{scheduled && <span className="text-slate-400">（排班 {scheduled}）</span>}</div>
        <div className="flex items-start gap-1 text-xs text-slate-600"><MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" /><span>{event.location}</span></div>
        {event.note && <div className="text-xs text-slate-400 italic">{event.note}</div>}
      </div>
      {lightbox && (
        <Dialog open onOpenChange={() => setLightbox(false)}>
          <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200"><DialogTitle className="text-sm font-semibold text-slate-900">{label}照片</DialogTitle><DialogDescription className="sr-only">打卡照片</DialogDescription></div>
            <div className="bg-slate-50 p-4 flex items-center justify-center"><img src={event.photo} alt="打卡" className="max-w-full max-h-[360px] rounded-lg object-contain" /></div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end"><button onClick={() => setLightbox(false)} className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">關閉</button></div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Manual override dialog ─────────────────────────────────
const SELECTABLE_STATUSES: DayStatus[] = ["正常", "遲到早退", "缺勤"];

function OverrideDialog({ date, currentStatus, onClose, onSave }: {
  date: string; currentStatus: DayStatus;
  onClose: () => void; onSave: (status: DayStatus, reason: string) => void;
}) {
  const [newStatus, setNewStatus] = useState<DayStatus>(currentStatus === "正常" ? "遲到早退" : "正常");
  const [reason, setReason] = useState("");
  const isModifyingNormal = currentStatus === "正常";
  const canSave = reason.trim().length >= 5;
  const month = date.slice(5, 7), day = date.slice(8, 10);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">手動修改考勤狀態</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">{month}月{day}日 · 目前狀態：{currentStatus}</DialogDescription>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Warning */}
          <div className={`rounded-xl border p-3.5 ${isModifyingNormal ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isModifyingNormal ? "text-amber-600" : "text-slate-400"}`} />
              <div className={`text-xs leading-relaxed ${isModifyingNormal ? "text-amber-800" : "text-slate-600"}`}>
                {isModifyingNormal
                  ? "您正在修改已被系統驗核為正常的考勤記錄。此操作將覆蓋系統判定結果，並留下操作記錄，請確認有充分理由後再修改。"
                  : "手動修改考勤狀態將覆蓋系統記錄，此操作不可撤銷，請填寫修改原因。"}
              </div>
            </div>
          </div>
          {/* New status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">修改為</label>
            <div className="flex gap-2">
              {SELECTABLE_STATUSES.filter(s => s !== currentStatus).map(s => {
                const cfg = DAY_CFG[s];
                return (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${newStatus === s ? `${cfg.bg} ${cfg.border} ${cfg.labelColor} ring-2 ring-offset-1 ring-blue-400` : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Reason (required) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              修改原因 <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">（至少 5 個字）</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="請填寫修改原因，此記錄將留存備查…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!canSave} onClick={() => { onSave(newStatus, reason); onClose(); }}>
            確認修改
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function EmployeeAttendancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const empId = searchParams.get("id") ?? "";

  const employee = HIRED_EMPLOYEES.find(e => e.id === empId);
  const [viewYear, setViewYear] = useState(CUR_YEAR);
  const [viewMonth, setViewMonth] = useState(CUR_MONTH);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(INITIAL_CORRECTIONS);
  const [overrides, setOverrides] = useState<Record<string, { status: DayStatus; reason: string }>>({});
  const [overrideTarget, setOverrideTarget] = useState<{ date: string; currentStatus: DayStatus } | null>(null);
  const [rejectStep, setRejectStep] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-slate-400">找不到此員工資料</div>
      </div>
    );
  }

  const monthlyRecords = buildMonthRecords(employee, viewYear, viewMonth, EXCEPTIONS[employee.id] ?? {});

  const corrMap = new Map(corrections.map(c => [c.id, c]));
  const effectiveStatus = (r: DayRecord): DayStatus => {
    if (overrides[r.date]) return overrides[r.date].status;
    if (r.correctionId && corrMap.get(r.correctionId)?.status === "已批准") return "已補卡";
    return r.status;
  };

  const getRecord = (day: number): DayRecord | undefined =>
    monthlyRecords.find(r => r.date === `${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`);

  // Stats for this month
  const past = monthlyRecords.filter(r => r.scheduledStart && r.status !== "待上班");
  const totalScheduled = monthlyRecords.filter(r => r.scheduledStart).length;
  const normal = past.filter(r => ["正常","已補卡"].includes(effectiveStatus(r))).length;
  const abnormal = past.filter(r => ["遲到早退","缺勤"].includes(effectiveStatus(r))).length;
  const pending = past.filter(r => effectiveStatus(r) === "補卡待審核").length;
  const rate = past.length > 0 ? Math.round(normal / past.length * 100) : 100;

  const grid = getCalendarGrid(viewYear, viewMonth);
  const WDAY_LABELS = ["一","二","三","四","五","六","日"];

  const todayDay = TODAY_STR.startsWith(`${viewYear}-${String(viewMonth).padStart(2,"0")}`)
    ? parseInt(TODAY_STR.slice(-2), 10) : null;

  const selectedRecord = selectedDay ? getRecord(selectedDay) : undefined;
  const selectedEffective = selectedRecord ? effectiveStatus(selectedRecord) : undefined;
  const selectedCorr = selectedRecord?.correctionId ? corrMap.get(selectedRecord.correctionId) : undefined;

  const handleApprove = (id: string) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: "已批准", reviewedAt: now, reviewNote: "補卡已批准" } : c));
  };
  const handleReject = (id: string, note: string) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: "已拒絕", reviewedAt: now, reviewNote: note } : c));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/attendance")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /><span className="text-sm">返回考勤管理</span>
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(employee.id)}`}>{employee.name[0]}</div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">{employee.name} 的考勤記錄</h1>
                  <p className="text-xs text-slate-500 mt-0.5">{employee.jobTitle} · {employee.store} · {employee.hiringType}</p>
                </div>
              </div>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl">

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {[
                { label: "本月應出勤", value: `${totalScheduled}天`, color: "bg-white border-slate-200 text-slate-900" },
                { label: "已出勤",     value: `${past.length}天`,    color: "bg-white border-slate-200 text-slate-700" },
                { label: "考勤正常",   value: `${normal}天`,         color: "bg-green-50 border-green-200 text-green-800" },
                { label: "考勤異常",   value: `${abnormal}天`,       color: abnormal > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-white border-slate-200 text-slate-400" },
                { label: "出勤率",     value: `${rate}%`,            color: rate >= 90 ? "bg-green-50 border-green-200 text-green-800" : rate >= 75 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
                  <div className="text-xl font-semibold">{s.value}</div>
                  <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Calendar card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => { if (viewMonth===1) { setViewMonth(12); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); setSelectedDay(null); }}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div className="font-semibold text-slate-900">{fmtMonthYear(viewYear, viewMonth)}</div>
                <button onClick={() => { if (viewMonth===12) { setViewMonth(1); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); setSelectedDay(null); }}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {WDAY_LABELS.map(l => (
                  <div key={l} className={`text-center text-xs font-semibold py-1 ${l === "六" || l === "日" ? "text-rose-400" : "text-slate-400"}`}>{l}</div>
                ))}
              </div>

              {/* Days */}
              {grid.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-2 mb-2">
                  {row.map((day, ci) => {
                    if (!day) return <div key={ci} className="h-[72px]" />;
                    const rec = getRecord(day);
                    const eff = rec ? effectiveStatus(rec) : "未排班";
                    return (
                      <DayCell key={ci} day={day} record={rec} isSelected={selectedDay === day}
                        isToday={day === todayDay} effectiveStatus={eff}
                        onClick={() => { setSelectedDay(selectedDay === day ? null : day); setRejectStep(false); setRejectNote(""); }}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 flex-wrap">
                {(["正常","遲到早退","缺勤","補卡待審核","已補卡","待上班"] as DayStatus[]).map(s => (
                  <span key={s} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded border shrink-0 ${DAY_CFG[s].bg} ${DAY_CFG[s].border}`} />{DAY_CFG[s].label || s}</span>
                ))}
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDay && selectedRecord && selectedEffective && selectedEffective !== "未排班" && selectedEffective !== "待上班" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {/* Day header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="text-base font-semibold text-slate-900">{viewMonth}月{selectedDay}日</div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${DAY_CFG[selectedEffective].bg} ${DAY_CFG[selectedEffective].border} ${DAY_CFG[selectedEffective].labelColor}`}>
                      {DAY_CFG[selectedEffective].hasDot && <span className={`w-1.5 h-1.5 rounded-full ${DAY_CFG[selectedEffective].dotColor}`} />}
                      {DAY_CFG[selectedEffective].label}
                    </span>
                    {overrides[selectedRecord.date] && (
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">已手動修改</span>
                    )}
                  </div>
                  <button
                    onClick={() => setOverrideTarget({ date: selectedRecord.date, currentStatus: selectedEffective })}
                    className="text-xs text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    修改考勤狀態
                  </button>
                </div>

                {/* Show override reason if overridden */}
                {overrides[selectedRecord.date] && (
                  <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <div className="text-xs font-medium text-blue-700 mb-0.5">修改原因備注</div>
                    <div className="text-xs text-slate-700">{overrides[selectedRecord.date].reason}</div>
                  </div>
                )}

                {/* Scheduled summary */}
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-4">
                  <div className="text-center"><div className="text-xs text-slate-500 mb-0.5">排班上班</div><div className="text-sm font-semibold text-slate-900 tabular-nums">{selectedRecord.scheduledStart}</div></div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <div className="text-center"><div className="text-xs text-slate-500 mb-0.5">排班下班</div><div className="text-sm font-semibold text-slate-900 tabular-nums">{selectedRecord.scheduledEnd}</div></div>
                </div>

                {/* Clock records */}
                <div className="flex gap-3 mb-4">
                  <ClockBlock label="上班打卡" event={selectedRecord.clockIn}  scheduled={selectedRecord.scheduledStart} />
                  <ClockBlock label="下班打卡" event={selectedRecord.clockOut} scheduled={selectedRecord.scheduledEnd}   />
                </div>

                {/* Correction if any */}
                {selectedCorr && (
                  <div className={`rounded-xl border p-4 ${selectedCorr.status === "待審核" ? "bg-violet-50 border-violet-200" : selectedCorr.status === "已批准" ? "bg-teal-50 border-teal-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5" />補卡申請</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${selectedCorr.status === "待審核" ? "bg-violet-100 text-violet-700 border-violet-300" : selectedCorr.status === "已批准" ? "bg-teal-100 text-teal-700 border-teal-300" : "bg-slate-100 text-slate-600 border-slate-300"}`}>{selectedCorr.status}</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-1">補 {selectedCorr.type} · 申請時間 {selectedCorr.requestedTime}</div>
                    <div className="text-xs text-slate-700 bg-white/60 rounded-lg p-2.5 mb-3 leading-relaxed border border-white/80">{selectedCorr.reason}</div>
                    {selectedCorr.status === "待審核" && !rejectStep && (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 text-xs h-8 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setRejectStep(true)}><XCircle className="w-3.5 h-3.5 mr-1" />拒絕</Button>
                        <Button className="flex-1 text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => handleApprove(selectedCorr.id)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />批准補卡</Button>
                      </div>
                    )}
                    {selectedCorr.status === "待審核" && rejectStep && (
                      <div className="space-y-2">
                        <textarea rows={2} value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="請填寫拒絕原因…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white" />
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => setRejectStep(false)}>返回</Button>
                          <Button className="flex-1 text-xs h-8 bg-red-600 hover:bg-red-700 text-white" onClick={() => { handleReject(selectedCorr.id, rejectNote); setRejectStep(false); }}>確認拒絕</Button>
                        </div>
                      </div>
                    )}
                    {selectedCorr.status !== "待審核" && selectedCorr.reviewNote && (
                      <div className="text-xs text-slate-600 bg-white/60 rounded p-2 border border-white/80">審核備注：{selectedCorr.reviewNote}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Override dialog */}
      {overrideTarget && (
        <OverrideDialog
          date={overrideTarget.date}
          currentStatus={overrideTarget.currentStatus}
          onClose={() => setOverrideTarget(null)}
          onSave={(status, reason) => {
            setOverrides(prev => ({ ...prev, [overrideTarget.date]: { status, reason } }));
            setOverrideTarget(null);
          }}
        />
      )}
    </div>
  );
}
