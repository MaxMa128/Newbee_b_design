import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Briefcase, Building2, LayoutDashboard,
  MapPin, Plus, X, Clock, ChevronDown, AlertTriangle, Info,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

// ── Types ────────────────────────────────────────────────
type HiringType = "fulltime" | "parttime" | "temporary";
type WageUnit    = "hourly" | "daily" | "weekly" | "monthly";

interface ShiftEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

// ── Constants ─────────────────────────────────────────────
const WEEKDAYS = [
  { key: "mon", label: "週一" },
  { key: "tue", label: "週二" },
  { key: "wed", label: "週三" },
  { key: "thu", label: "週四" },
  { key: "fri", label: "週五" },
  { key: "sat", label: "週六" },
  { key: "sun", label: "週日" },
];

const JOB_CATEGORIES = [
  "服務業 / 零售門市",
  "餐飲業",
  "活動推廣",
  "教育",
  "物流運輸",
  "客戶服務",
  "清潔",
  "推銷及中介",
  "建造業",
  "保安及物業",
  "生產及保障",
  "維修技術",
];

const HK_DISTRICTS: { region: string; districts: string[] }[] = [
  {
    region: "香港島",
    districts: ["中西區", "灣仔區", "東區", "南區"],
  },
  {
    region: "九龍",
    districts: ["油尖旺區", "深水埗區", "九龍城區", "黃大仙區", "觀塘區"],
  },
  {
    region: "新界",
    districts: ["荃灣區", "屯門區", "元朗區", "北區", "大埔區", "西貢區", "沙田區", "葵青區", "離島區"],
  },
];

const CERT_SUGGESTIONS = [
  "電工證", "食品衛生證", "急救證", "駕駛執照（私家車）",
  "駕駛執照（貨車）", "叉車操作證", "保安牌", "物業管理證",
];

const WAGE_UNIT_LABELS: Record<WageUnit, string> = {
  hourly:  "每小時",
  daily:   "每天",
  weekly:  "每週",
  monthly: "每月",
};

// ── Sub-components ────────────────────────────────────────

function SectionCard({ index, title, desc, children }: {
  index: number; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
            {index}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// Map placeholder dialog
function MapPickerModal({ open, address, onConfirm, onClose }: {
  open: boolean; address: string;
  onConfirm: (addr: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState(address);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-semibold text-slate-900">選擇工作地點</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋地址或地標"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-input-background outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0">搜尋</Button>
          </div>
        </div>
        {/* Fake map */}
        <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-slate-200 relative bg-[#e8eaed]" style={{ height: 240 }}>
          {/* Street grid */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Background */}
            <rect width="100%" height="100%" fill="#e8eaed" />
            {/* Major horizontal streets */}
            {[40, 90, 140, 190].map(y => (
              <rect key={y} x="0" y={y} width="100%" height="10" fill="#d4d6d9" />
            ))}
            {/* Major vertical streets */}
            {[80, 160, 240, 320, 400].map(x => (
              <rect key={x} x={x} y="0" width="10" height="100%" fill="#d4d6d9" />
            ))}
            {/* Buildings */}
            {[
              [10,10,62,24],[92,10,62,24],[172,10,60,24],[244,10,70,24],[326,10,66,24],
              [10,54,62,30],[92,54,62,30],[172,54,60,30],[244,54,70,30],[326,54,66,30],
              [10,104,62,28],[92,104,62,28],[172,104,60,28],[244,104,70,28],[326,104,66,28],
              [10,154,62,28],[92,154,62,28],[172,154,60,28],[244,154,70,28],[326,154,66,28],
              [10,204,62,28],[92,204,62,28],[172,204,60,28],[244,204,70,28],[326,204,66,28],
            ].map(([x,y,w,h],i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="#cdd0d5" />
            ))}
          </svg>
          {/* Pin */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-0.5 opacity-40" />
              {search && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-xs text-slate-700 font-medium px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 whitespace-nowrap max-w-[200px] text-center truncate">
                  {search}
                </div>
              )}
            </div>
          </div>
          {/* Note */}
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-[10px] text-slate-500 px-2 py-1 rounded-md">
            示意圖，實際接入地圖 API 後可互動
          </div>
        </div>
        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { onConfirm(search); onClose(); }}>
            確認此地點
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export function CreateJobPage() {
  const navigate = useNavigate();

  // Section 1
  const [jobTitle, setJobTitle]     = useState("");
  const [hiringType, setHiringType] = useState<HiringType>("fulltime");

  // Section 2 — regular schedule
  const [workDays, setWorkDays]         = useState<string[]>([]);
  const [workStart, setWorkStart]       = useState("");
  const [workEnd, setWorkEnd]           = useState("");

  // Section 2 — temporary shifts
  const [shifts, setShifts] = useState<ShiftEntry[]>([
    { id: "1", date: "", startTime: "", endTime: "" },
  ]);

  // Section 3
  const [jobCategory, setJobCategory] = useState("");
  const [jobDesc, setJobDesc]               = useState("");
  const [certInput, setCertInput]           = useState("");
  const [certs, setCerts]                   = useState<string[]>([]);

  // Section 4
  const [storeName, setStoreName]   = useState("");
  const [storeAddr, setStoreAddr]   = useState("");
  const [district, setDistrict]     = useState("");
  const [showMap, setShowMap]       = useState(false);

  // Section 5
  const [headcount, setHeadcount] = useState("");
  const [wageUnit, setWageUnit]   = useState<WageUnit>("hourly");
  const [wageMin, setWageMin]     = useState("");
  const [wageMax, setWageMax]     = useState("");

  // ── Handlers ──
  const toggleDay = (key: string) => {
    setWorkDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  };

  const addShift = () => {
    setShifts(prev => [...prev, { id: Date.now().toString(), date: "", startTime: "", endTime: "" }]);
  };
  const removeShift = (id: string) => {
    if (shifts.length === 1) return;
    setShifts(prev => prev.filter(s => s.id !== id));
  };
  const updateShift = (id: string, field: keyof ShiftEntry, value: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addCert = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !certs.includes(trimmed)) setCerts(prev => [...prev, trimmed]);
    setCertInput("");
  };
  const removeCert = (c: string) => setCerts(prev => prev.filter(x => x !== c));

  const inputClass = "h-10 rounded-lg border border-input bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 w-full transition-[color,box-shadow]";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">NewBee</div>
              <div className="text-xs text-slate-500">商戶平台</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {[
              { key: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "工作台", path: "/dashboard" },
              { key: "jobs",      icon: <Briefcase className="w-5 h-5" />,       label: "職位管理", path: "/jobs" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.key === "jobs"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回工作台</span>
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <h1 className="text-xl font-semibold text-slate-900">建立招聘職位</h1>
          </div>
        </header>

        {/* Form body */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto space-y-6 pb-32">

            {/* ── Section 1: Basic Info ── */}
            <SectionCard index={1} title="職位基本資料" desc="填寫職位名稱及招聘方式">
              <div className="space-y-5">
                <Field label="職位名稱" required>
                  <input
                    className={inputClass}
                    placeholder="例：收銀員、倉務員、侍應生"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                  />
                </Field>
                <Field label="招聘方式" required>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: "fulltime",  label: "全職" },
                      { value: "parttime",  label: "兼職" },
                      { value: "temporary", label: "臨時工" },
                    ] as { value: HiringType; label: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setHiringType(opt.value)}
                        className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          hiringType === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* ── Section 2: Working Hours ── */}
            <SectionCard index={2} title="工作時間" desc={
              hiringType === "temporary"
                ? "填寫具體的工作日期及起止時間"
                : "選擇每週工作日及每日起止時間"
            }>
              {hiringType !== "temporary" ? (
                <div className="space-y-5">
                  <Field label="工作日" required>
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map(day => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            workDays.includes(day.key)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <FieldRow>
                    <Field label="上班時間" required>
                      <input type="time" className={inputClass} value={workStart} onChange={e => setWorkStart(e.target.value)} />
                    </Field>
                    <Field label="下班時間" required>
                      <input type="time" className={inputClass} value={workEnd} onChange={e => setWorkEnd(e.target.value)} />
                    </Field>
                  </FieldRow>
                </div>
              ) : (
                <div className="space-y-3">
                  {shifts.map((shift, idx) => (
                    <div key={shift.id} className="flex items-end gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Field label={`第 ${idx + 1} 日 — 日期`} required>
                          <input type="date" className={inputClass} value={shift.date} onChange={e => updateShift(shift.id, "date", e.target.value)} />
                        </Field>
                        <Field label="上班時間" required>
                          <input type="time" className={inputClass} value={shift.startTime} onChange={e => updateShift(shift.id, "startTime", e.target.value)} />
                        </Field>
                        <Field label="下班時間" required>
                          <input type="time" className={inputClass} value={shift.endTime} onChange={e => updateShift(shift.id, "endTime", e.target.value)} />
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeShift(shift.id)}
                        disabled={shifts.length === 1}
                        className="mb-0.5 w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addShift}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增工作日期
                  </button>
                </div>
              )}
            </SectionCard>

            {/* ── Section 3: Job Details ── */}
            <SectionCard index={3} title="職位詳情" desc="描述職位要求及所需資歷">
              <div className="space-y-5">
                <Field label="工作種類" required>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={jobCategory}
                      onChange={e => setJobCategory(e.target.value)}
                    >
                      <option value="">請選擇工作種類</option>
                      {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </Field>
                <Field label="工作要求">
                  <textarea
                    rows={5}
                    className="w-full rounded-lg border border-input bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none transition-[color,box-shadow]"
                    placeholder="詳細描述工作內容、應聘要求、工作環境等…"
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                  />
                </Field>
                <Field label="技能 / 證書要求">
                  <div className="space-y-2.5">
                    {certs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {certs.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                            {c}
                            <button type="button" onClick={() => removeCert(c)} className="hover:text-blue-900">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        placeholder="輸入證書名稱後按 Enter 或點擊新增"
                        value={certInput}
                        onChange={e => setCertInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCert(certInput); } }}
                      />
                      <Button type="button" variant="outline" className="shrink-0" onClick={() => addCert(certInput)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Quick-add suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {CERT_SUGGESTIONS.filter(s => !certs.includes(s)).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addCert(s)}
                          className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* ── Section 4: Store Info ── */}
            <SectionCard index={4} title="門店資訊" desc="填寫工作地點及門店名稱">
              <div className="space-y-5">
                <Field label="門店名稱" required>
                  <input
                    className={inputClass}
                    placeholder="例：旺角分店、中環總部"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                  />
                </Field>
                <Field label="工作地區" required>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                    >
                      <option value="">請選擇工作地區</option>
                      {HK_DISTRICTS.map(g => (
                        <optgroup key={g.region} label={g.region}>
                          {g.districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </Field>
                <Field label="詳細地址" required>
                  <div className="flex gap-2">
                    <input
                      className={inputClass}
                      placeholder="例：香港九龍旺角彌敦道 xxx 號 x 樓"
                      value={storeAddr}
                      onChange={e => setStoreAddr(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-1.5 border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      onClick={() => setShowMap(true)}
                    >
                      <MapPin className="w-4 h-4" />
                      地圖選址
                    </Button>
                  </div>
                  {storeAddr && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {storeAddr}
                    </div>
                  )}
                </Field>
              </div>
            </SectionCard>

            {/* ── Section 5: Recruitment Details ── */}
            <SectionCard index={5} title="招募詳情" desc="設定招募人數及薪酬範圍">
              <div className="space-y-5">
                <Field label="招募人數" required>
                  <div className="relative w-40">
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      placeholder="0"
                      value={headcount}
                      onChange={e => setHeadcount(e.target.value)}
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-slate-400 pointer-events-none">人</span>
                  </div>
                </Field>

                <Field label="薪酬範圍" required>
                  <div className="space-y-3">
                    {/* Wage unit selector */}
                    <div className="flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                      {(Object.entries(WAGE_UNIT_LABELS) as [WageUnit, string][]).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setWageUnit(val)}
                          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            wageUnit === val
                              ? "bg-white shadow-sm text-blue-700 border border-blue-100"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Min / Max */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-sm text-slate-400 pointer-events-none">HK$</span>
                        <input
                          type="number"
                          min={0}
                          className={`${inputClass} pl-10`}
                          placeholder="最低"
                          value={wageMin}
                          onChange={e => setWageMin(e.target.value)}
                        />
                      </div>
                      <span className="text-slate-400 text-sm shrink-0">–</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-sm text-slate-400 pointer-events-none">HK$</span>
                        <input
                          type="number"
                          min={0}
                          className={`${inputClass} pl-10`}
                          placeholder="最高"
                          value={wageMax}
                          onChange={e => setWageMax(e.target.value)}
                        />
                      </div>
                      <span className="text-sm text-slate-500 shrink-0">{WAGE_UNIT_LABELS[wageUnit]}</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      若最低薪酬和最高薪酬相同，則只顯示一個薪酬數字。
                    </p>
                  </div>
                </Field>
              </div>
            </SectionCard>

          </div>
        </main>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-10">
          <p className="text-xs text-slate-400">帶 <span className="text-red-500">*</span> 號為必填項目</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>取消</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 px-8" onClick={() => navigate("/dashboard")}>
              發布職位
            </Button>
          </div>
        </div>
      </div>

      {/* Map picker modal */}
      <MapPickerModal
        open={showMap}
        address={storeAddr}
        onConfirm={setStoreAddr}
        onClose={() => setShowMap(false)}
      />
    </div>
  );
}
