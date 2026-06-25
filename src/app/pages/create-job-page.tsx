import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Plus, X, ChevronDown, AlertTriangle, Info,
  Store, MapPin, Clock, Copy, Users, Calendar, ExternalLink,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

// ── Types ──────────────────────────────────────────────────
type HiringType   = "fulltime" | "parttime" | "temporary";
type LocationMode = "site" | "fixed" | "remote";

interface TempDateSlot { id: string; date: string; start: string; end: string; }

interface SiteEntry {
  id: string;
  storeId: string;
  shiftId: string;
  tempDates: TempDateSlot[];
  wage: string;
  wageMax: string;
  overtimeWage: string;
  mealBreak: boolean;
  shuttleBus: boolean;
  regularCount: string;
  backupCount: string;
}

interface LocationConfig {
  shiftId: string;
  tempDates: TempDateSlot[];
  wage: string;
  wageMax: string;
  overtimeWage: string;
  mealBreak: boolean;
  shuttleBus: boolean;
  regularCount: string;
  backupCount: string;
}

// ── Constants ──────────────────────────────────────────────
const JOB_CATEGORIES = [
  "服務業 / 零售門市","餐飲業","活動推廣","教育","物流運輸",
  "客戶服務","清潔","推銷及中介","建造業","保安及物業","生產及保障","維修技術",
];

const CERT_SUGGESTIONS = [
  "電工證","食品衛生證","急救證","駕駛執照（私家車）",
  "駕駛執照（貨車）","叉車操作證","保安牌","物業管理證",
];

const VALIDITY_OPTIONS = [1, 2, 3, 6, 12];

const HK_DISTRICTS = [
  "旺角","尖沙咀","油麻地","佐敦","深水埗","九龍城","黃大仙","觀塘","紅磡","土瓜灣",
  "中環","上環","金鐘","灣仔","銅鑼灣","天后","北角","西灣河","筲箕灣",
  "葵涌","荃灣","沙田","元朗","大埔","屯門","粉嶺","將軍澳","東涌",
];

const MOCK_STORES = [
  { id: "S001", name: "旺角分店",   district: "旺角",   address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓" },
  { id: "S002", name: "中環分店",   district: "中環",   address: "香港中環皇后大道中 30 號娛樂行 G 樓" },
  { id: "S003", name: "尖沙咀分店", district: "尖沙咀", address: "香港九龍尖沙咀廣東道 17 號海港城" },
  { id: "S004", name: "葵涌倉庫",   district: "葵涌",   address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉" },
  { id: "S005", name: "觀塘辦公室", district: "觀塘",   address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓" },
  { id: "S006", name: "中環總部",   district: "中環",   address: "香港中環皇后大道中 15 號 20 樓" },
];

const MOCK_SHIFTS = [
  { id: "ST-001", name: "標準兼職班（週一至週五）",  summary: "週一至週五 · 09:00–18:00", weeklyHours: 45 },
  { id: "ST-002", name: "週末班次",                  summary: "週六、週日 · 10:00–22:00", weeklyHours: 24 },
  { id: "ST-003", name: "全週晚班",                  summary: "每天 · 17:00–23:00",       weeklyHours: 42 },
  { id: "ST-004", name: "彈性三天班",                summary: "週一、三、五 自訂時段",     weeklyHours: 18 },
  { id: "ST-005", name: "週末促銷班",                summary: "週六、週日 各自訂時段",     weeklyHours: 13 },
];

const WEEKDAY_KEYS   = ["mon","tue","wed","thu","fri","sat","sun"] as const;
const WEEKDAY_LABELS = ["週一","週二","週三","週四","週五","週六","週日"];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
const today = new Date().toISOString().slice(0, 10);
const emptyTempDate = (): TempDateSlot => ({ id: Date.now().toString() + Math.random(), date: "", start: "09:00", end: "18:00" });

// ── Quick-add Store modal (consistent with 工作網點管理) ────
function QuickAddStoreModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (s: { id: string; name: string; district: string; address: string }) => void;
}) {
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [district, setDistrict] = useState(HK_DISTRICTS[0]);
  const [address, setAddress]   = useState("");
  const [phone, setPhone]       = useState("");
  const ok = name.trim() && district && address.trim();
  const cls = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">快速新增工作網點</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">新增後立即可在當前頁面選用</DialogDescription>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">網點名稱 <span className="text-red-500">*</span></label><input value={name} onChange={e => setName(e.target.value)} placeholder="例：旺角分店" className={cls} /></div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">地區 <span className="text-red-500">*</span></label>
            <div className="relative">
              <select value={district} onChange={e => setDistrict(e.target.value)} className={`${cls} appearance-none cursor-pointer pr-8`}>
                {HK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">詳細地址 <span className="text-red-500">*</span></label><textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="填寫完整地址…" className={`${cls} resize-none`} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">聯絡電話 <span className="text-slate-400 font-normal">（選填）</span></label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+852 XXXX XXXX" className={cls} /></div>
          <button onClick={() => navigate("/stores")} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" />前往「工作網點管理」進行完整設定
          </button>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!ok}
            onClick={() => { onAdd({ id: `S-NEW-${Date.now()}`, name, district, address }); onClose(); }}>
            新增網點
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Quick-add Shift modal (full, consistent with 班次管理) ──
function QuickAddShiftModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (s: { id: string; name: string; summary: string; weeklyHours: number }) => void;
}) {
  const navigate = useNavigate();
  interface CustomRow { id: string; day: string; start: string; end: string; }
  const [name, setName]             = useState("");
  const [type, setType]             = useState<"weekly" | "custom">("weekly");
  const [weeklyDays, setWeeklyDays] = useState<string[]>(["mon","tue","wed","thu","fri"]);
  const [weeklyStart, setWeeklyStart] = useState("09:00");
  const [weeklyEnd, setWeeklyEnd]     = useState("18:00");
  const [rows, setRows] = useState<CustomRow[]>([{ id:"0", day:"mon", start:"09:00", end:"18:00" }]);

  const toggleDay = (d: string) => setWeeklyDays(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d]);
  const calcH = (s: string, e: string) => { const [sh,sm]=s.split(":").map(Number); const [eh,em]=e.split(":").map(Number); return Math.max(0,(eh*60+em-sh*60-sm)/60); };
  const weeklyHours = type === "weekly"
    ? Math.round(weeklyDays.length * calcH(weeklyStart, weeklyEnd) * 10)/10
    : Math.round(rows.reduce((s,r)=>s+calcH(r.start,r.end),0)*10)/10;

  const canSave = name.trim() && (type === "weekly" ? weeklyDays.length > 0 && weeklyStart < weeklyEnd : rows.length > 0 && rows.every(r=>r.start<r.end));
  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const buildSummary = () => {
    if (type === "weekly") {
      const days = weeklyDays.map(d => WEEKDAY_LABELS[WEEKDAY_KEYS.indexOf(d as typeof WEEKDAY_KEYS[number])]);
      return `${days.join("、")} · ${weeklyStart}–${weeklyEnd}`;
    }
    return `${rows.length} 個自訂時段`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">快速新增班次模板</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">新增後立即可在當前頁面選用</DialogDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">模板名稱 <span className="text-red-500">*</span></label><input value={name} onChange={e=>setName(e.target.value)} placeholder="例：標準兼職班、週末晚班…" className={`w-full ${cls}`} /></div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">設定方式</label>
            <div className="grid grid-cols-2 gap-2">
              {([["weekly","按週統一設定","所有選定日期使用同一時段"],["custom","每天自訂時段","每天可設定不同的時間段"]] as const).map(([v,l,s]) => (
                <button key={v} type="button" onClick={() => setType(v)}
                  className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all ${type === v ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <span className={`text-sm font-medium ${type===v?"text-blue-700":"text-slate-800"}`}>{l}</span>
                  <span className="text-xs text-slate-400">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {type === "weekly" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">工作日 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_KEYS.map((k,i) => (
                    <button key={k} type="button" onClick={() => toggleDay(k)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${weeklyDays.includes(k)?"border-blue-500 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                      {WEEKDAY_LABELS[i]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">上班時間</label><input type="time" value={weeklyStart} onChange={e=>setWeeklyStart(e.target.value)} className={`w-full ${cls}`} /></div>
                <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600">下班時間</label><input type="time" value={weeklyEnd} onChange={e=>setWeeklyEnd(e.target.value)} className={`w-full ${cls}`} /></div>
              </div>
            </>
          )}

          {type === "custom" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">自訂時段 <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setRows(p=>[...p,{id:Date.now().toString(),day:"mon",start:"09:00",end:"18:00"}])} className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" />新增時段</button>
              </div>
              {rows.map(row => (
                <div key={row.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <select value={row.day} onChange={e=>setRows(p=>p.map(r=>r.id===row.id?{...r,day:e.target.value}:r))} className={`${cls} w-20 shrink-0`}>
                    {WEEKDAY_KEYS.map((k,i)=><option key={k} value={k}>{WEEKDAY_LABELS[i]}</option>)}
                  </select>
                  <input type="time" value={row.start} onChange={e=>setRows(p=>p.map(r=>r.id===row.id?{...r,start:e.target.value}:r))} className={`${cls} flex-1`} />
                  <span className="text-slate-400 text-sm shrink-0">–</span>
                  <input type="time" value={row.end} onChange={e=>setRows(p=>p.map(r=>r.id===row.id?{...r,end:e.target.value}:r))} className={`${cls} flex-1`} />
                  <button type="button" onClick={()=>{if(rows.length>1)setRows(p=>p.filter(r=>r.id!==row.id))}} disabled={rows.length===1} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {canSave && weeklyHours > 0 && (
            <div className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm">每週合計工時：<span className="font-bold">{weeklyHours} 小時</span></div>
          )}

          <button onClick={() => navigate("/shift-templates")} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" />前往「班次管理」進行完整設定
          </button>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!canSave}
            onClick={() => { onAdd({ id:`ST-NEW-${Date.now()}`, name, summary: buildSummary(), weeklyHours }); onClose(); }}>
            新增班次
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Temp dates editor ──────────────────────────────────────
function TempDatesEditor({ dates, onChange }: {
  dates: TempDateSlot[];
  onChange: (d: TempDateSlot[]) => void;
}) {
  const update = (id: string, f: keyof TempDateSlot, v: string) =>
    onChange(dates.map(d => d.id === id ? { ...d, [f]: v } : d));
  const remove = (id: string) => { if (dates.length > 1) onChange(dates.filter(d => d.id !== id)); };
  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">工作日期及時段 <span className="text-red-500">*</span></label>
      {dates.map((d, i) => (
        <div key={d.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-400 w-4 shrink-0 text-center">{i+1}</span>
          <input type="date" value={d.date} onChange={e => update(d.id,"date",e.target.value)} className={`${cls} flex-1 min-w-0`} />
          <input type="time" value={d.start} onChange={e => update(d.id,"start",e.target.value)} className={`${cls} w-24 shrink-0`} />
          <span className="text-slate-400 text-sm shrink-0">–</span>
          <input type="time" value={d.end} onChange={e => update(d.id,"end",e.target.value)} className={`${cls} w-24 shrink-0`} />
          <button type="button" onClick={() => remove(d.id)} disabled={dates.length === 1}
            className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors shrink-0"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...dates, emptyTempDate()])}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
        <Plus className="w-3.5 h-3.5" />新增工作日期
      </button>
    </div>
  );
}

// ── Per-location config form ───────────────────────────────
function ConfigForm({ value, onChange, shifts, onAddShift, hiringType }: {
  value: LocationConfig;
  onChange: (v: LocationConfig) => void;
  shifts: typeof MOCK_SHIFTS;
  onAddShift: () => void;
  hiringType: HiringType;
}) {
  const set = (k: keyof LocationConfig, v: LocationConfig[keyof LocationConfig]) => onChange({ ...value, [k]: v });
  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const isTemp     = hiringType === "temporary";
  const isFulltime = hiringType === "fulltime";
  const unit = isFulltime ? "/ 月" : "/ 小時";

  // 15% range validation for fulltime
  const wageMin = parseFloat(value.wage) || 0;
  const wageMaxV = parseFloat(value.wageMax) || 0;
  const rangeExceeded = isFulltime && wageMin > 0 && wageMaxV > 0 && wageMaxV > wageMin
    && (wageMaxV - wageMin) / wageMin > 0.15;
  const rangeInvalid = isFulltime && wageMin > 0 && wageMaxV > 0 && wageMaxV < wageMin;

  return (
    <div className="space-y-4">
      {/* Shift OR Temp dates */}
      {isTemp ? (
        <TempDatesEditor dates={value.tempDates} onChange={td => set("tempDates", td)} />
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">班次模板 <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={value.shiftId} onChange={e => set("shiftId", e.target.value)} className={`w-full ${cls} appearance-none cursor-pointer pr-8`}>
              <option value="">請選擇班次模板</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name} — {s.summary}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
          
        </div>
      )}

      {/* Wage — fulltime: range; others: single + overtime */}
      {isFulltime ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">月薪範圍 <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none">HK$</span>
              <input type="number" min={0} value={value.wage} onChange={e => set("wage", e.target.value)}
                placeholder="最低月薪" className={`${cls} pl-10 w-full ${rangeExceeded || rangeInvalid ? "border-red-300 focus:ring-red-400" : ""}`} />
            </div>
            <span className="text-slate-400 text-sm shrink-0">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none">HK$</span>
              <input type="number" min={0} value={value.wageMax} onChange={e => set("wageMax", e.target.value)}
                placeholder="最高月薪" className={`${cls} pl-10 w-full ${rangeExceeded || rangeInvalid ? "border-red-300 focus:ring-red-400" : ""}`} />
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">/ 月</span>
          </div>
          {rangeInvalid && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />最高月薪不能低於最低月薪</p>}
          {rangeExceeded && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />薪酬範圍差距不能超過 15%（目前差距 {Math.round((wageMaxV - wageMin) / wageMin * 100)}%）</p>}
          {!rangeInvalid && !rangeExceeded && wageMin > 0 && wageMaxV > 0 && (
            <p className="text-xs text-green-600">差距 {Math.round((wageMaxV - wageMin) / wageMin * 100)}%，符合規定 ✓</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">薪資 <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none">HK$</span>
              <input type="number" min={0} value={value.wage} onChange={e => set("wage", e.target.value)} placeholder="薪資" className={`${cls} pl-10 w-full`} />
            </div>
            <span className="text-[10px] text-slate-400">{unit}</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">加班薪資 <span className="text-slate-400 font-normal">（選填）</span></label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none">HK$</span>
              <input type="number" min={0} value={value.overtimeWage} onChange={e => set("overtimeWage", e.target.value)} placeholder="加班薪資" className={`${cls} pl-10 w-full`} />
            </div>
            <span className="text-[10px] text-slate-400">{unit}</span>
          </div>
        </div>
      )}

      {/* Meal break */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">飯鐘</label>
        <div className="flex gap-2">
          {[{ val: true, label: "有飯鐘" }, { val: false, label: "無飯鐘" }].map(opt => (
            <button key={String(opt.val)} type="button" onClick={() => set("mealBreak", opt.val)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${value.mealBreak === opt.val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shuttle bus */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">直達班車</label>
        <div className="flex gap-2">
          {[{ val: true, label: "有班車" }, { val: false, label: "無班車" }].map(opt => (
            <button key={String(opt.val)} type="button" onClick={() => set("shuttleBus", opt.val)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${value.shuttleBus === opt.val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headcount */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">招募人數 <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-slate-600 whitespace-nowrap">正式員工</span>
            <input type="number" min={0} value={value.regularCount} onChange={e => set("regularCount", e.target.value)} placeholder="0" className={`${cls} w-20 text-center`} />
            <span className="text-xs text-slate-400">人</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-slate-600 whitespace-nowrap">候補人員</span>
            <input type="number" min={0} value={value.backupCount} onChange={e => set("backupCount", e.target.value)} placeholder="0" className={`${cls} w-20 text-center`} />
            <span className="text-xs text-slate-400">人</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Site entry card ────────────────────────────────────────
function SiteEntryCard({ entry, stores, shifts, index, onUpdate, onDuplicate, onRemove, onAddStore, onAddShift, hiringType, isDuplicate }: {
  entry: SiteEntry; stores: typeof MOCK_STORES; shifts: typeof MOCK_SHIFTS;
  index: number; onUpdate: (e: SiteEntry) => void; onDuplicate: () => void; onRemove: () => void;
  onAddStore: () => void; onAddShift: () => void; hiringType: HiringType; isDuplicate: boolean;
}) {
  const set = (k: keyof SiteEntry, v: SiteEntry[keyof SiteEntry]) => onUpdate({ ...entry, [k]: v });
  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const store = stores.find(s => s.id === entry.storeId);
  return (
    <div className={`rounded-xl border p-5 space-y-4 ${isDuplicate ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
          <span className="text-sm font-semibold text-slate-800">{store ? `${store.name} · ${store.district}` : "選擇工作網點"}</span>
          {isDuplicate && <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">⚠ 重複崗位</span>}
        </div>
        <div className="flex gap-1">
          <button onClick={onDuplicate} title="複製並新增" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">工作網點 <span className="text-red-500">*</span></label>
        <div className="relative">
          <select value={entry.storeId} onChange={e => set("storeId", e.target.value)} className={`w-full ${cls} appearance-none cursor-pointer pr-8`}>
            <option value="">請選擇網點</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} — {s.district}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        {store && <div className="text-xs text-slate-400 flex items-start gap-1"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />{store.address}</div>}
        
      </div>
      <ConfigForm
        value={{ shiftId: entry.shiftId, tempDates: entry.tempDates, wage: entry.wage, wageMax: entry.wageMax, overtimeWage: entry.overtimeWage, mealBreak: entry.mealBreak, shuttleBus: entry.shuttleBus, regularCount: entry.regularCount, backupCount: entry.backupCount }}
        onChange={v => onUpdate({ ...entry, ...v })}
        shifts={shifts} onAddShift={onAddShift} hiringType={hiringType}
      />
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────
function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      {[{ n: 1, label: "職位基本資料" }, { n: 2, label: "工作地配置" }].map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          {i > 0 && <div className={`w-12 h-px ${current > i ? "bg-blue-500" : "bg-slate-200"}`} />}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${current === s.n ? "bg-blue-600 text-white" : current > s.n ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}>
              {current > s.n ? "✓" : s.n}
            </div>
            <span className={`text-sm font-medium ${current === s.n ? "text-blue-700" : current > s.n ? "text-green-700" : "text-slate-400"}`}>{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
const defaultLocConfig = (): LocationConfig => ({ shiftId: "", tempDates: [emptyTempDate()], wage: "", wageMax: "", overtimeWage: "", mealBreak: true, shuttleBus: false, regularCount: "", backupCount: "" });
const defaultSiteEntry = (): SiteEntry => ({ id: Date.now().toString(), storeId: "", shiftId: "", tempDates: [emptyTempDate()], wage: "", wageMax: "", overtimeWage: "", mealBreak: true, shuttleBus: false, regularCount: "", backupCount: "" });

export function CreateJobPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [jobTitle, setJobTitle]         = useState("");
  const [hiringType, setHiringType]     = useState<HiringType>("parttime");
  const [payPeriod, setPayPeriod]       = useState<"daily" | "weekly" | "monthly">("monthly");
  const [jobCategory, setJobCategory]   = useState("");
  const [jobDesc, setJobDesc]           = useState("");
  const [certInput, setCertInput]       = useState("");
  const [certs, setCerts]               = useState<string[]>([]);
  const [validityMonths, setValidityMonths] = useState(2);
  const [validityCustom, setValidityCustom] = useState("");

  const effectiveValidity = validityCustom ? Number(validityCustom) : validityMonths;
  const expiryPreview = addMonths(today, effectiveValidity);
  const addCert = (v: string) => { const t = v.trim(); if (t && !certs.includes(t)) setCerts(p=>[...p,t]); setCertInput(""); };
  const removeCert = (c: string) => setCerts(p => p.filter(x => x !== c));

  // Step 2
  const [locationMode, setLocationMode] = useState<LocationMode>("site");
  const [siteEntries, setSiteEntries]   = useState<SiteEntry[]>([defaultSiteEntry()]);
  const [fixedAddress, setFixedAddress] = useState("");
  const [locConfig, setLocConfig]       = useState<LocationConfig>(defaultLocConfig());

  const [localStores, setLocalStores] = useState<typeof MOCK_STORES>([]);
  const [localShifts, setLocalShifts] = useState<typeof MOCK_SHIFTS>([]);
  const allStores = [...MOCK_STORES, ...localStores];
  const allShifts = [...MOCK_SHIFTS, ...localShifts];

  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [submitError, setSubmitError]   = useState("");

  const getSiteKey = (e: SiteEntry) => `${e.storeId}|${e.shiftId}|${JSON.stringify(e.tempDates.map(t=>t.date+t.start+t.end))}|${e.wage}|${e.overtimeWage}|${e.mealBreak}|${e.shuttleBus}|${e.regularCount}|${e.backupCount}`;
  const duplicateIds = (() => {
    if (locationMode !== "site") return new Set<string>();
    const keys = siteEntries.map(e => ({ id: e.id, key: getSiteKey(e) }));
    const seen = new Map<string, number>();
    keys.forEach(({ key }) => seen.set(key, (seen.get(key) ?? 0) + 1));
    return new Set(keys.filter(({ key }) => seen.get(key)! > 1).map(({ id }) => id));
  })();

  const step1Valid = jobTitle.trim() && jobCategory;
  const configValid = (c: LocationConfig) => {
    const baseOk = c.wage && c.regularCount;
    if (hiringType === "temporary") return baseOk && c.tempDates.length > 0 && c.tempDates.every(d => d.date && d.start < d.end);
    return baseOk && c.shiftId;
  };
  const step2Valid = (() => {
    if (locationMode === "site") return siteEntries.every(e => e.storeId && configValid({ shiftId: e.shiftId, tempDates: e.tempDates, wage: e.wage, wageMax: e.wageMax, overtimeWage: e.overtimeWage, mealBreak: e.mealBreak, regularCount: e.regularCount, backupCount: e.backupCount }));
    if (locationMode === "fixed") return fixedAddress.trim() && configValid(locConfig);
    return configValid(locConfig);
  })();

  const handleSubmit = () => {
    if (duplicateIds.size > 0) { setSubmitError("存在重複的網點崗位，請修改後重新提交。"); return; }
    navigate("/jobs");
  };

  const inputCls = "w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-[3px] focus:ring-ring/50 focus:border-ring transition-[color,box-shadow]";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/jobs")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">返回職位管理</span>
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <StepIndicator current={step} />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto pb-28 space-y-5">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="font-semibold text-slate-900">職位基本資料</div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">職位名稱 <span className="text-red-500">*</span></label>
                    <input className={inputCls} placeholder="例：收銀員、倉務員、侍應生" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">招聘方式 <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {([["fulltime","全職"],["parttime","兼職"],["temporary","臨時工"]] as [HiringType,string][]).map(([v,l]) => (
                        <button key={v} type="button" onClick={() => setHiringType(v)}
                          className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${hiringType===v?"border-blue-500 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {hiringType === "temporary" && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-blue-700">臨時工將在下一步「工作地配置」中填寫具體工作日期及時段，可新增多個日期。</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">結算周期 <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {([["daily","日結"],["weekly","週結"],["monthly","月結"]] as ["daily"|"weekly"|"monthly",string][]).map(([v,l]) => (
                        <button key={v} type="button" onClick={() => setPayPeriod(v)}
                          className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${payPeriod===v?"border-blue-500 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="font-semibold text-slate-900">職位詳情</div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">工作種類 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select className={`${inputCls} appearance-none cursor-pointer pr-8`} value={jobCategory} onChange={e => setJobCategory(e.target.value)}>
                        <option value="">請選擇工作種類</option>
                        {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">工作要求</label>
                    <textarea rows={4} className={`${inputCls} resize-none`} placeholder="詳細描述工作內容、應聘要求、工作環境等…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">技能 / 證書要求</label>
                    <div className="space-y-2.5">
                      {certs.length > 0 && (
                        <div className="flex flex-wrap gap-2">{certs.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                            {c}<button type="button" onClick={() => removeCert(c)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                          </span>
                        ))}</div>
                      )}
                      <div className="flex gap-2">
                        <input className={inputCls} placeholder="輸入證書名稱後按 Enter" value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCert(certInput); } }} />
                        <Button type="button" variant="outline" className="shrink-0" onClick={() => addCert(certInput)}><Plus className="w-4 h-4" /></Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">{CERT_SUGGESTIONS.filter(s => !certs.includes(s)).map(s => (
                        <button key={s} type="button" onClick={() => addCert(s)} className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">+ {s}</button>
                      ))}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="font-semibold text-slate-900">職位有效期</div>
                  <div className="flex flex-wrap gap-2">
                    {VALIDITY_OPTIONS.map(m => (
                      <button key={m} type="button" onClick={() => { setValidityMonths(m); setValidityCustom(""); }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${validityMonths===m&&!validityCustom?"border-blue-500 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                        {m} 個月
                      </button>
                    ))}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">自訂</span>
                      <div className="relative w-20">
                        <input type="number" min={1} max={12} placeholder="月數" value={validityCustom}
                          onChange={e => { const v=e.target.value; if(v===""||+v>=1&&+v<=12)setValidityCustom(v); }}
                          className={`${inputCls} pr-7`} />
                        <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 pointer-events-none">月</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-slate-600">預計截止日期：<span className="font-semibold text-slate-900 ml-1">{expiryPreview}</span></span>
                    <span className="text-xs text-slate-400 ml-1">（{effectiveValidity} 個月後）</span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />有效期最長不超過 12 個月，到期後職位自動下架。</p>
                </div>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="font-semibold text-slate-900 mb-4">選擇工作地點模式</div>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { val:"site" as const,   label:"工作網點",    sub:"從已有網點選擇", icon:<Store className="w-4 h-4" /> },
                      { val:"fixed" as const,  label:"固定地點",    sub:"填寫具體工作地址", icon:<MapPin className="w-4 h-4" /> },
                      { val:"remote" as const, label:"靈活 / 遠程", sub:"無固定工作地點", icon:<Users className="w-4 h-4" /> },
                    ]).map(opt => (
                      <button key={opt.val} type="button" onClick={() => setLocationMode(opt.val)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border text-center transition-all ${locationMode===opt.val?"border-blue-500 bg-blue-50":"border-slate-200 bg-white hover:border-slate-300"}`}>
                        <span className={locationMode===opt.val?"text-blue-600":"text-slate-400"}>{opt.icon}</span>
                        <span className={`text-sm font-medium ${locationMode===opt.val?"text-blue-700":"text-slate-800"}`}>{opt.label}</span>
                        <span className="text-xs text-slate-400">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {submitError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{submitError}</span>
                  </div>
                )}

                {locationMode === "site" && (
                  <>
                    {siteEntries.map((entry, idx) => (
                      <SiteEntryCard key={entry.id} entry={entry} stores={allStores} shifts={allShifts} index={idx}
                        onUpdate={u => setSiteEntries(prev => prev.map(e => e.id === entry.id ? u : e))}
                        onDuplicate={() => setSiteEntries(prev => [...prev, { ...entry, id: Date.now().toString() }])}
                        onRemove={() => setSiteEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== entry.id) : prev)}
                        onAddStore={() => setShowAddStore(true)} onAddShift={() => setShowAddShift(true)}
                        hiringType={hiringType} isDuplicate={duplicateIds.has(entry.id)} />
                    ))}
                    <button onClick={() => setSiteEntries(prev => [...prev, defaultSiteEntry()])}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                      <Plus className="w-4 h-4" />新增工作網點崗位
                    </button>
                  </>
                )}

                {locationMode === "fixed" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="font-semibold text-slate-900">工作地點及崗位資料</div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">工作地址 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <textarea rows={2} value={fixedAddress} onChange={e => setFixedAddress(e.target.value)} placeholder="填寫具體工作地址…" className={`${inputCls} pl-9 resize-none`} />
                      </div>
                    </div>
                    <ConfigForm value={locConfig} onChange={setLocConfig} shifts={allShifts} onAddShift={() => setShowAddShift(true)} hiringType={hiringType} />
                  </div>
                )}

                {locationMode === "remote" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="font-semibold text-slate-900">崗位資料</div>
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-blue-700">靈活 / 遠程崗位無固定工作地點，由僱主和求職者另行協商。</span>
                    </div>
                    <ConfigForm value={locConfig} onChange={setLocConfig} shifts={allShifts} onAddShift={() => setShowAddShift(true)} hiringType={hiringType} />
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-10">
          <p className="text-xs text-slate-400">帶 <span className="text-red-500">*</span> 號為必填項目</p>
          <div className="flex gap-3">
            {step === 1 ? (
              <>
                <Button variant="outline" onClick={() => navigate("/jobs")}>取消</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8" disabled={!step1Valid}
                  onClick={() => { setStep(2); setSubmitError(""); }}>
                  下一步：工作地配置
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
                <Button variant="outline" onClick={() => navigate("/jobs")}>取消</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8" disabled={!step2Valid} onClick={handleSubmit}>
                  發布職位
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {showAddStore && <QuickAddStoreModal onClose={() => setShowAddStore(false)} onAdd={s => setLocalStores(prev => [...prev, s])} />}
      {showAddShift && <QuickAddShiftModal onClose={() => setShowAddShift(false)} onAdd={s => setLocalShifts(prev => [...prev, s])} />}
    </div>
  );
}
