import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Pencil, X,
  Download, AlertTriangle, ChevronDown, CalendarDays, Search,
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

function buildDefaultSchedule(employees: HiredEmployee[], dates: string[]): ScheduleMap {
  const result: ScheduleMap = {};
  for (const emp of employees) {
    result[emp.id] = {};
    for (const date of dates) {
      const key = getWeekdayKey(date);
      result[emp.id][date] = emp.defaultDays.includes(key)
        ? { startTime: emp.defaultStart, endTime: emp.defaultEnd, isDayOff: false, isDefault: true }
        : null;
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
        shift.isDefault
          ? isToday ? "bg-blue-100 border-blue-300" : "bg-blue-50 border-blue-200 hover:bg-blue-100"
          : isToday ? "bg-green-50 border-green-300" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <span className="text-xs font-semibold text-slate-800 tabular-nums">{shift.startTime}</span>
      <span className="text-[9px] text-slate-400 leading-none my-0.5">—</span>
      <span className="text-xs font-semibold text-slate-800 tabular-nums">{shift.endTime}</span>
      {shift.isDefault && (
        <span className="absolute top-1 right-1.5 text-[8px] text-blue-400 font-bold leading-none">默</span>
      )}
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
      onSave({ startTime: "", endTime: "", isDayOff: true, isDefault: false });
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
    <div className={`rounded-xl p-4 border ${color}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function SchedulePage() {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [viewMode, setViewMode]       = useState<"employee" | "position">("employee");
  const [posFilter, setPosFilter]     = useState("all");
  const [empSearch, setEmpSearch]     = useState("");
  const [posSearch, setPosSearch]     = useState("");
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const posDropdownRef = useRef<HTMLDivElement>(null);
  const [allSchedules, setAllSchedules] = useState<Record<string, ScheduleMap>>({});
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

  const schedule: ScheduleMap = allSchedules[weekKey] ?? buildDefaultSchedule(HIRED_EMPLOYEES, weekDates);

  if (!allSchedules[weekKey]) {
    setAllSchedules(prev => ({ ...prev, [weekKey]: buildDefaultSchedule(HIRED_EMPLOYEES, weekDates) }));
  }

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
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
                <Download className="w-4 h-4" />匯出排班表
              </Button>
              <NotificationDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">

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
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 shrink-0" />已排班（默認）</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-200 shrink-0" />已排班（手動）</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 shrink-0" />休假</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-slate-300 shrink-0" />未排班</span>
          </div>

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
