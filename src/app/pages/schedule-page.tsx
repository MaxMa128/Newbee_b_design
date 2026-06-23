import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Pencil, X,
  Download, AlertTriangle, ChevronDown, CalendarDays, Search,
  LayoutGrid, List,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

// ── Types ──────────────────────────────────────────────────
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

interface ShiftSlot {
  startTime: string;
  endTime: string;
  isDayOff: boolean;
  isDefault: boolean;
}

type ScheduleMap = Record<string, Record<string, ShiftSlot | null>>;

interface EditTarget {
  empId: string;
  empName: string;
  empJobTitle: string;
  date: string;
  existing: ShiftSlot | null;
}

// ── Mock data ──────────────────────────────────────────────
const HIRED_EMPLOYEES: HiredEmployee[] = [
  {
    id: "APP-001", name: "陳大文", gender: "男",
    jobTitle: "收銀員", store: "旺角分店", hiringType: "兼職",
    defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "09:00", defaultEnd: "18:00",
  },
  {
    id: "APP-017", name: "劉嘉穎", gender: "女",
    jobTitle: "客服代表", store: "中環總部", hiringType: "全職",
    defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "09:00", defaultEnd: "18:00",
  },
  {
    id: "APP-007", name: "黃曉恩", gender: "女",
    jobTitle: "侍應生", store: "中環分店", hiringType: "臨時工",
    defaultDays: ["fri","sat","sun"], defaultStart: "17:00", defaultEnd: "23:00",
  },
  {
    id: "APP-008", name: "林嘉慧", gender: "女",
    jobTitle: "侍應生", store: "中環分店", hiringType: "臨時工",
    defaultDays: ["fri","sat","sun"], defaultStart: "17:00", defaultEnd: "23:00",
  },
  {
    id: "APP-012", name: "蔡敏儀", gender: "女",
    jobTitle: "推廣員", store: "尖沙咀分店", hiringType: "臨時工",
    defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "10:00", defaultEnd: "18:00",
  },
  {
    id: "APP-013", name: "許志安", gender: "男",
    jobTitle: "推廣員", store: "尖沙咀分店", hiringType: "臨時工",
    defaultDays: ["mon","tue","wed","thu","fri"], defaultStart: "10:00", defaultEnd: "18:00",
  },
];

const WEEKDAY_LABELS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
const WEEKDAY_KEYS   = ["mon",  "tue",  "wed",  "thu",  "fri",  "sat",  "sun"];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
];
function avatarColor(id: string) {
  return AVATAR_COLORS[parseInt(id.replace("APP-", ""), 10) % AVATAR_COLORS.length];
}

const HIRING_COLORS: Record<HiredEmployee["hiringType"], string> = {
  "全職":   "bg-blue-50 text-blue-600 border-blue-200",
  "兼職":   "bg-indigo-50 text-indigo-600 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-600 border-violet-200",
};

// ── Helpers ────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

function getWeekDates(weekOffset: number): string[] {
  const d = new Date();
  const dayOfWeek = d.getDay();
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysFromMon + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

function getWeekdayKey(dateStr: string): string {
  const day = new Date(dateStr).getDay();
  return WEEKDAY_KEYS[day === 0 ? 6 : day - 1];
}

function buildEmptySchedule(employees: HiredEmployee[], dates: string[]): ScheduleMap {
  const result: ScheduleMap = {};
  for (const emp of employees) {
    result[emp.id] = {};
    for (const date of dates) {
      result[emp.id][date] = null; // all cells empty — schedule only from onboarding or manual entry
    }
  }
  return result;
}

function fmtMonthDay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── Shift cell ─────────────────────────────────────────────
function ShiftCell({ shift, isToday, onClick }: {
  shift: ShiftSlot | null | undefined;
  isToday: boolean;
  onClick: () => void;
}) {
  if (!shift) {
    return (
      <div
        onClick={onClick}
        className={`h-16 flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-all group ${
          isToday ? "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-1 text-slate-300 group-hover:text-slate-500 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">排班</span>
        </div>
      </div>
    );
  }
  if (shift.isDayOff) {
    return (
      <div
        onClick={onClick}
        className="h-16 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
      >
        <span className="text-xs font-medium text-slate-500">休假</span>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={`h-16 flex flex-col items-center justify-center rounded-lg border cursor-pointer transition-all group relative ${
        isToday ? "bg-green-50 border-green-300" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <span className="text-xs font-semibold text-slate-800 tabular-nums">{shift.startTime}</span>
      <span className="text-[9px] text-slate-400 leading-none my-0.5">—</span>
      <span className="text-xs font-semibold text-slate-800 tabular-nums">{shift.endTime}</span>
      <Pencil className="absolute bottom-1 right-1.5 w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ── Edit shift dialog ──────────────────────────────────────
function EditShiftDialog({ target, onClose, onSave }: {
  target: EditTarget;
  onClose: () => void;
  onSave: (slot: ShiftSlot | null) => void;
}) {
  const isModifying = !!target.existing && !target.existing.isDayOff;
  const [start, setStart]       = useState(target.existing?.startTime ?? "");
  const [end, setEnd]           = useState(target.existing?.endTime ?? "");
  const [isDayOff, setIsDayOff] = useState(target.existing?.isDayOff ?? false);
  const [confirmed, setConfirmed] = useState(false);

  const weekdayIdx = WEEKDAY_KEYS.indexOf(getWeekdayKey(target.date));
  const dayLabel   = WEEKDAY_LABELS[weekdayIdx] ?? "";

  const canSave = isDayOff
    ? (!isModifying || confirmed)
    : (!!start && !!end && (!isModifying || confirmed));

  const handleSave = () => {
    if (isDayOff) {
      onSave({ startTime: "", endTime: "", isDayOff: true, isDefault: false }); // isDefault kept for type compat
    } else {
      onSave({ startTime: start, endTime: end, isDayOff: false, isDefault: false });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">
            {target.existing ? "修改排班" : "新增排班"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">
            {target.empName} · {target.empJobTitle} · {dayLabel} {fmtMonthDay(target.date)}
          </DialogDescription>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Modification confirmation warning */}
          {isModifying && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-800 mb-0.5">修改已有排班，請先確認已溝通</div>
                  <div className="text-xs text-amber-700 leading-relaxed">
                    排班時間調整前，請確保已與員工充分溝通並達成共識，避免產生糾紛。
                  </div>
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 shrink-0 mt-0.5"
                />
                <span className="text-xs font-medium text-slate-800 leading-relaxed">
                  本人確認已與員工充分溝通排班調整事宜，員工已知悉並同意
                </span>
              </label>
            </div>
          )}

          {/* Day off toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-sm font-medium text-slate-800">設為休假日</div>
              <div className="text-xs text-slate-400 mt-0.5">員工此日不需上班</div>
            </div>
            <button
              type="button"
              onClick={() => setIsDayOff(v => !v)}
              className={`w-10 h-6 rounded-full relative transition-colors ${isDayOff ? "bg-blue-600" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isDayOff ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Time pickers */}
          {!isDayOff && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">上班時間</label>
                <input
                  type="time"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">下班時間</label>
                <input
                  type="time"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          {target.existing && (
            <Button
              variant="outline"
              className="border-red-200 text-red-500 hover:bg-red-50 shrink-0"
              onClick={() => onSave(null)}
            >
              刪除
            </Button>
          )}
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!canSave}
            onClick={handleSave}
          >
            確認儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Summary card ───────────────────────────────────────────
function SCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    null
  );
}

// ── Main Page ──────────────────────────────────────────────
function getWeekKeyForDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dow = d.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const mon = new Date(d);
  mon.setDate(d.getDate() - daysFromMon);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

function buildDemoSchedules(): Record<string, ScheduleMap> {
  // Pre-populated demo data representing onboarding-confirmed schedules
  const result: Record<string, ScheduleMap> = {};
  const weeks = ["2026-06-01","2026-06-08","2026-06-15","2026-06-22","2026-06-29"];
  for (const wk of weeks) {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(wk); d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const ws: ScheduleMap = {};
    for (const emp of HIRED_EMPLOYEES) {
      ws[emp.id] = {};
      for (const date of dates) {
        const dow = new Date(date).getDay();
        const wKey = WEEKDAY_KEYS[dow === 0 ? 6 : dow - 1];
        ws[emp.id][date] = emp.defaultDays.includes(wKey)
          ? { startTime: emp.defaultStart, endTime: emp.defaultEnd, isDayOff: false, isDefault: false }
          : null;
      }
    }
    result[wk] = ws;
  }
  return result;
}

function fmtShiftCompact(shift: ShiftSlot | null): string | null {
  if (!shift) return null;
  if (shift.isDayOff) return "休";
  const h = (t: string) => { const [hr, m] = t.split(":").map(Number); return m === 0 ? String(hr) : t; };
  return `${h(shift.startTime)}-${h(shift.endTime)}`;
}

function getMonthlyStats(emp: HiredEmployee, year: number, month: number) {
  const days = new Date(year, month, 0).getDate();
  let scheduledDays = 0, hours = 0;
  for (let d = 1; d <= days; d++) {
    const ds = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow = new Date(ds).getDay();
    const wk = WEEKDAY_KEYS[dow === 0 ? 6 : dow - 1];
    if (emp.defaultDays.includes(wk)) {
      scheduledDays++;
      const [sh, sm] = emp.defaultStart.split(":").map(Number);
      const [eh, em] = emp.defaultEnd.split(":").map(Number);
      hours += (eh * 60 + em - sh * 60 - sm) / 60;
    }
  }
  return { scheduledDays, hours: Math.round(hours * 10) / 10 };
}

export function SchedulePage() {
  const [displayType, setDisplayType] = useState<"calendar" | "list">("calendar");
  const [listMonth, setListMonth]     = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1 }; });
  const [weekOffset, setWeekOffset]   = useState(0);
  const [viewMode, setViewMode]       = useState<"employee" | "position">("employee");
  const [posFilter, setPosFilter]     = useState("all");
  const [empSearch, setEmpSearch]     = useState("");
  const [posSearch, setPosSearch]     = useState("");
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const posDropdownRef = useRef<HTMLDivElement>(null);
  const [allSchedules, setAllSchedules] = useState<Record<string, ScheduleMap>>(() => buildDemoSchedules());
  const [listDateFilter, setListDateFilter] = useState<string | null>(null);
  const [editTarget, setEditTarget]   = useState<EditTarget | null>(null);
  const [exportToast, setExportToast] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (posDropdownRef.current && !posDropdownRef.current.contains(e.target as Node)) {
        setPosDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const weekDates = getWeekDates(weekOffset);
  const weekKey   = weekDates[0];

  const schedule: ScheduleMap = allSchedules[weekKey] ?? (() => {
    const s = buildEmptySchedule(HIRED_EMPLOYEES, weekDates);
    setAllSchedules(prev => ({ ...prev, [weekKey]: s }));
    return s;
  })();

  const positions = Array.from(new Set(HIRED_EMPLOYEES.map(e => e.jobTitle)));
  const filteredPositions = posSearch
    ? positions.filter(p => p.includes(posSearch))
    : positions;

  const displayedEmployees = HIRED_EMPLOYEES
    .filter(e => viewMode === "position" && posFilter !== "all" ? e.jobTitle === posFilter : true)
    .filter(e => !empSearch || e.name.includes(empSearch) || e.jobTitle.includes(empSearch));

  const scheduledCount = displayedEmployees.filter(emp =>
    weekDates.some(d => { const s = schedule[emp.id]?.[d]; return s && !s.isDayOff; })
  ).length;

  const todayCount = displayedEmployees.filter(emp => {
    const s = schedule[emp.id]?.[TODAY];
    return s && !s.isDayOff;
  }).length;

  const handleCellClick = (emp: HiredEmployee, date: string) => {
    setEditTarget({
      empId: emp.id, empName: emp.name, empJobTitle: emp.jobTitle,
      date, existing: schedule[emp.id]?.[date] ?? null,
    });
  };

  const handleSaveShift = (slot: ShiftSlot | null) => {
    if (!editTarget) return;
    setAllSchedules(prev => ({
      ...prev,
      [weekKey]: {
        ...schedule,
        [editTarget.empId]: { ...(schedule[editTarget.empId] ?? {}), [editTarget.date]: slot },
      },
    }));
    setEditTarget(null);
  };

  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">排班管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理已錄用員工的每週班次安排</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button onClick={() => setDisplayType("calendar")} title="日曆視圖"
                  className={`p-1.5 rounded-md transition-colors ${displayType === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setDisplayType("list")} title="列表視圖"
                  className={`p-1.5 rounded-md transition-colors ${displayType === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
                <Download className="w-4 h-4" />匯出排班表
              </Button>
              <NotificationDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">

          {/* ── List view ── */}
          {displayType === "list" && (() => {
            const daysInMonth = new Date(listMonth.year, listMonth.month, 0).getDate();
            const monthDates = Array.from({length: daysInMonth}, (_, i) => {
              const d = i + 1;
              return `${listMonth.year}-${String(listMonth.month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            });

            const getShift = (empId: string, dateStr: string): ShiftSlot | null =>
              allSchedules[getWeekKeyForDate(dateStr)]?.[empId]?.[dateStr] ?? null;

            const getEmpSummary = (empId: string) => {
              let days = 0, hours = 0;
              for (const d of monthDates) {
                const s = getShift(empId, d);
                if (s && !s.isDayOff) {
                  days++;
                  const [sh, sm] = s.startTime.split(":").map(Number);
                  const [eh, em] = s.endTime.split(":").map(Number);
                  hours += (eh * 60 + em - sh * 60 - sm) / 60;
                }
              }
              return { days, hours: Math.round(hours * 10) / 10 };
            };

            const getDateCount = (dateStr: string) =>
              displayedEmployees.filter(e => { const s = getShift(e.id, dateStr); return s && !s.isDayOff; }).length;

            const matrixEmps = listDateFilter
              ? displayedEmployees.filter(e => { const s = getShift(e.id, listDateFilter); return s && !s.isDayOff; })
              : displayedEmployees;

            const WDAY_SHORT = ["日","一","二","三","四","五","六"];

            return (
              <>
                {/* Month nav + search + active filter pill */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setListMonth(m => m.month === 1 ? {year:m.year-1,month:12} : {...m,month:m.month-1})} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                    <span className="text-sm font-semibold text-slate-900 min-w-[90px] text-center">{listMonth.year}年{listMonth.month}月</span>
                    <button onClick={() => setListMonth(m => m.month === 12 ? {year:m.year+1,month:1} : {...m,month:m.month+1})} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="搜尋員工…"
                      className="h-8 pl-8 pr-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
                    {empSearch && <button onClick={() => setEmpSearch("")} className="absolute right-2 top-2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                  {listDateFilter && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                      篩選：{listDateFilter.slice(5).replace("-","月")}日（{getDateCount(listDateFilter)} 人有排班）
                      <button onClick={() => setListDateFilter(null)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">點擊日期列標題可篩選當天排班</span>
                </div>

                {/* Matrix table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm" style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: `${200 + daysInMonth * 58 + 140}px`, borderCollapse: "collapse" }}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs">
                        {/* Sticky employee header */}
                        <th style={{ position:"sticky", left:0, zIndex:3, background:"#f8fafc", minWidth:"180px", maxWidth:"180px" }}
                          className="px-3 py-3 text-left border-r border-slate-200 font-semibold text-slate-500 uppercase tracking-wide">
                          員工 / 工種 / 類型
                        </th>
                        {/* Date headers */}
                        {monthDates.map(dateStr => {
                          const day = parseInt(dateStr.slice(-2), 10);
                          const dow = new Date(dateStr).getDay();
                          const isWeekend = dow === 0 || dow === 6;
                          const isActive = listDateFilter === dateStr;
                          const cnt = getDateCount(dateStr);
                          return (
                            <th key={dateStr} style={{ minWidth:"56px", maxWidth:"56px" }}
                              className={`py-1.5 px-0.5 border-r border-slate-100 text-center cursor-pointer select-none transition-colors ${isActive ? "bg-blue-100 border-blue-200" : isWeekend ? "bg-rose-50" : "hover:bg-slate-100"}`}
                              onClick={() => setListDateFilter(isActive ? null : dateStr)}>
                              <div className={`text-xs font-semibold ${isActive ? "text-blue-700" : isWeekend ? "text-rose-500" : "text-slate-700"}`}>{day}</div>
                              <div className={`text-[9px] ${isActive ? "text-blue-500" : isWeekend ? "text-rose-400" : "text-slate-400"}`}>{WDAY_SHORT[dow]}</div>
                              {!listDateFilter && cnt > 0 && <div className="text-[8px] text-blue-500 font-medium">{cnt}</div>}
                              {isActive && <div className="w-full h-0.5 bg-blue-500 mt-0.5 rounded-full" />}
                            </th>
                          );
                        })}
                        {/* Summary headers */}
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap border-l border-slate-200" style={{ minWidth:"60px" }}>天數</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap" style={{ minWidth:"60px" }}>工時</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixEmps.length === 0 ? (
                        <tr><td colSpan={daysInMonth + 3} className="py-12 text-center text-sm text-slate-400">
                          {listDateFilter ? "當日無排班人員" : "本月暫無排班記錄"}
                        </td></tr>
                      ) : matrixEmps.map((emp, idx) => {
                        const summary = getEmpSummary(emp.id);
                        return (
                          <tr key={emp.id} className={`border-b border-slate-50 last:border-0 ${idx % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                            {/* Sticky employee cell */}
                            <td style={{ position:"sticky", left:0, zIndex:2, background: idx % 2 === 1 ? "#f9fafb" : "white", minWidth:"180px", maxWidth:"180px" }}
                              className="px-3 py-2.5 border-r border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${avatarColor(emp.id)}`}>{emp.name[0]}</div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 truncate">{emp.name}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] text-slate-500 truncate">{emp.jobTitle}</span>
                                    <span className={`text-[8px] px-1 py-0 rounded border font-medium shrink-0 ${emp.hiringType === "全職" ? "bg-blue-50 text-blue-600 border-blue-200" : emp.hiringType === "兼職" ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-violet-50 text-violet-600 border-violet-200"}`}>{emp.hiringType}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Day cells */}
                            {monthDates.map(dateStr => {
                              const shift = getShift(emp.id, dateStr);
                              const text = fmtShiftCompact(shift);
                              const isActive = listDateFilter === dateStr;
                              return (
                                <td key={dateStr} style={{ minWidth:"56px", maxWidth:"56px" }}
                                  className={`text-center px-0.5 py-2 border-r border-slate-100 ${isActive ? "bg-blue-50" : ""}`}>
                                  {text === "休" ? (
                                    <span className="text-[9px] text-slate-400 font-medium">休</span>
                                  ) : text ? (
                                    <span className="text-[9px] font-semibold text-blue-700 leading-tight block">{text}</span>
                                  ) : null}
                                </td>
                              );
                            })}
                            {/* Summary cells */}
                            <td className="text-center px-2 py-2 border-l border-slate-200">
                              <span className={`text-xs font-semibold ${summary.days > 0 ? "text-slate-900" : "text-slate-300"}`}>{summary.days}</span>
                              <span className="text-[9px] text-slate-400 ml-0.5">天</span>
                            </td>
                            <td className="text-center px-2 py-2">
                              <span className={`text-xs font-semibold ${summary.hours > 0 ? "text-slate-900" : "text-slate-300"}`}>{summary.hours}</span>
                              <span className="text-[9px] text-slate-400 ml-0.5">h</span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Date filter summary row */}
                      {listDateFilter && (
                        <tr className="bg-blue-50 border-t border-blue-200">
                          <td style={{ position:"sticky", left:0, zIndex:2, background:"#eff6ff" }}
                            className="px-3 py-2 border-r border-blue-200 text-xs font-semibold text-blue-800">
                            當日合計 {getDateCount(listDateFilter)} 人
                          </td>
                          {monthDates.map(d => (
                            <td key={d} className={`text-center px-0.5 py-2 border-r border-blue-100 text-xs font-semibold ${d === listDateFilter ? "text-blue-700" : "text-transparent"}`}>
                              {d === listDateFilter ? `${getDateCount(d)}人` : "·"}
                            </td>
                          ))}
                          <td className="border-l border-blue-200" /><td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-slate-400">{listMonth.year}年{listMonth.month}月 · 共 {matrixEmps.length} 人 · 點擊日期列標題篩選，再次點擊取消</div>
              </>
            );
          })()}

          {displayType === "calendar" && (<>

          {/* Week nav + view toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="text-center min-w-[180px]">
                <div className="text-sm font-semibold text-slate-900">
                  {fmtMonthDay(weekDates[0])} – {fmtMonthDay(weekDates[6])}
                </div>
                {weekOffset === 0 && <div className="text-xs text-blue-600 mt-0.5">本週</div>}
                {weekOffset < 0 && <div className="text-xs text-slate-400 mt-0.5">前 {-weekOffset} 週</div>}
                {weekOffset > 0 && <div className="text-xs text-slate-400 mt-0.5">後 {weekOffset} 週</div>}
              </div>
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-blue-600 hover:underline ml-1 transition-colors"
                >
                  回本週
                </button>
              )}
            </div>

            {/* View mode + search */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(["employee", "position"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      if (mode === "employee") { setPosFilter("all"); setPosSearch(""); }
                      else setEmpSearch("");
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {mode === "employee" ? "按員工" : "按崗位"}
                  </button>
                ))}
              </div>

              {/* Employee search */}
              {viewMode === "employee" && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="搜尋員工姓名…"
                    className="h-8 pl-8 pr-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  />
                  {empSearch && (
                    <button onClick={() => setEmpSearch("")} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Position searchable dropdown */}
              {viewMode === "position" && (
                <div ref={posDropdownRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={posFilter !== "all" ? posFilter : posSearch}
                      onChange={e => { setPosSearch(e.target.value); setPosFilter("all"); setPosDropdownOpen(true); }}
                      onFocus={() => setPosDropdownOpen(true)}
                      placeholder="搜尋崗位…"
                      className={`h-8 pl-8 pr-7 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 ${
                        posFilter !== "all" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200"
                      }`}
                    />
                    <button
                      onClick={() => setPosDropdownOpen(o => !o)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${posDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {posDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => { setPosFilter("all"); setPosSearch(""); setPosDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${posFilter === "all" ? "text-blue-700 bg-blue-50/60" : "text-slate-600"}`}
                      >
                        全部崗位
                      </button>
                      {filteredPositions.map(p => (
                        <button
                          key={p}
                          onClick={() => { setPosFilter(p); setPosSearch(""); setPosDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50 border-t border-slate-50 ${posFilter === p ? "text-blue-700 bg-blue-50/60" : "text-slate-600"}`}
                        >
                          {p}
                        </button>
                      ))}
                      {filteredPositions.length === 0 && (
                        <div className="px-3 py-3 text-xs text-slate-400 text-center">找不到符合的崗位</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active employee search indicator */}
          {empSearch && displayedEmployees.length === 0 && (
            <div className="text-sm text-slate-400 mb-4">找不到符合「{empSearch}」的員工</div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <SCard label="本週已排班員工" value={`${scheduledCount} 人`} sub="至少有一天班次" color="bg-white border-slate-200 text-slate-900" />
            <SCard label="今日在班" value={`${todayCount} 人`} sub="今日有班次安排" color="bg-blue-50 border-blue-200 text-blue-800" />
            <SCard label="待排班員工" value={`${displayedEmployees.length - scheduledCount} 人`} sub="本週尚無排班" color="bg-amber-50 border-amber-200 text-amber-800" />
          </div>

          {/* Schedule table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: "980px" }}>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[190px]">
                      員工
                    </th>
                    {weekDates.map((date, i) => {
                      const isToday = date === TODAY;
                      return (
                        <th key={date} className={`text-center px-2 py-3 text-xs font-semibold uppercase tracking-wide w-[112px] ${isToday ? "text-blue-700" : "text-slate-500"}`}>
                          <div>{WEEKDAY_LABELS[i]}</div>
                          <div className={`font-normal mt-0.5 ${isToday ? "text-blue-500" : "text-slate-400"}`}>
                            {fmtMonthDay(date)}
                            {isToday && <span className="ml-1 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-sm font-bold">今</span>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {displayedEmployees.map((emp, idx) => (
                    <tr key={emp.id} className={`border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(emp.id)}`}>
                            {emp.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span>{emp.jobTitle}</span>
                              <span className={`inline-flex px-1 py-0 rounded text-[10px] font-medium border ${HIRING_COLORS[emp.hiringType]}`}>
                                {emp.hiringType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {weekDates.map(date => (
                        <td key={date} className="px-1.5 py-2">
                          <ShiftCell
                            shift={schedule[emp.id]?.[date]}
                            isToday={date === TODAY}
                            onClick={() => handleCellClick(emp, date)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-200 shrink-0" />已排班</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 shrink-0" />休假</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-slate-300 shrink-0" />未排班（點擊新增）</span>
          </div>

          </>)} {/* end calendar view */}

        </main>
      </div>

      {/* Edit dialog */}
      {editTarget && (
        <EditShiftDialog
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveShift}
        />
      )}

      {/* Export toast */}
      {exportToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border border-green-200 bg-green-50 text-green-800 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CalendarDays className="w-4 h-4 text-green-600 shrink-0" />
          排班表已生成，正在準備下載…
        </div>
      )}
    </div>
  );
}
