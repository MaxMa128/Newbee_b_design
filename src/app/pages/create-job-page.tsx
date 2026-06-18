import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Briefcase,
  Plus, X, ChevronDown, AlertTriangle, Info,
  Search, Store, Check, Calendar,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

// ── Types ────────────────────────────────────────────────
type HiringType = "fulltime" | "parttime" | "temporary";

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

const CERT_SUGGESTIONS = [
  "電工證", "食品衛生證", "急救證", "駕駛執照（私家車）",
  "駕駛執照（貨車）", "叉車操作證", "保安牌", "物業管理證",
];

// Mock stores (would come from stores management module)
const MOCK_STORES = [
  { id: "S001", name: "旺角分店",     district: "旺角",   address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓" },
  { id: "S002", name: "中環分店",     district: "中環",   address: "香港中環皇后大道中 30 號娛樂行 G 樓" },
  { id: "S003", name: "尖沙咀分店",   district: "尖沙咀", address: "香港九龍尖沙咀廣東道 17 號海港城" },
  { id: "S004", name: "葵涌倉庫",     district: "葵涌",   address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉" },
  { id: "S005", name: "觀塘辦公室",   district: "觀塘",   address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓" },
  { id: "S006", name: "中環總部",     district: "中環",   address: "香港中環皇后大道中 15 號 20 樓" },
  { id: "S007", name: "銅鑼灣分店",   district: "銅鑼灣", address: "香港銅鑼灣記利佐治街 2 號 Fashion Walk" },
  { id: "S008", name: "沙田分店",     district: "沙田",   address: "香港新界沙田新城市廣場 1 期 5 樓" },
];

const VALIDITY_OPTIONS = [1, 2, 3, 6, 12];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

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

  // Section 4 — store multi-select
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [storeSearch, setStoreSearch]           = useState("");
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Section 5
  const [headcount, setHeadcount]     = useState("");
  const [wageMin, setWageMin]         = useState("");
  const [wageMax, setWageMax]         = useState("");
  const [validityMonths, setValidityMonths] = useState(2);
  const [validityCustom, setValidityCustom] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const effectiveValidity = validityCustom ? Number(validityCustom) : validityMonths;
  const expiryPreview = addMonths(today, effectiveValidity);

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

  const toggleStore = (id: string) => {
    setSelectedStoreIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const filteredStores = MOCK_STORES.filter(s =>
    s.name.includes(storeSearch) || s.district.includes(storeSearch)
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) {
        setStoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      <Sidebar />

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

            {/* ── Section 4: Store Selection ── */}
            <SectionCard index={4} title="選擇門店" desc="選擇此職位所屬的門店，可同時選擇多家">
              <div className="space-y-3">
                {/* Selected store tags */}
                {selectedStoreIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedStoreIds.map(id => {
                      const s = MOCK_STORES.find(x => x.id === id);
                      if (!s) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg font-medium">
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          {s.name}
                          <span className="text-blue-400 text-xs">{s.district}</span>
                          <button type="button" onClick={() => toggleStore(id)} className="hover:text-blue-900 ml-0.5">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown trigger */}
                <div ref={storeDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setStoreDropdownOpen(o => !o)}
                    className={`w-full h-10 flex items-center gap-2 px-3 rounded-lg border text-sm transition-colors text-left ${
                      storeDropdownOpen ? "border-blue-400 ring-[3px] ring-blue-500/20" : "border-input bg-input-background hover:border-slate-300"
                    }`}
                  >
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={selectedStoreIds.length > 0 ? "text-slate-600" : "text-muted-foreground"}>
                      {selectedStoreIds.length > 0
                        ? `已選 ${selectedStoreIds.length} 家門店，點擊繼續新增`
                        : "搜尋並選擇門店（可多選）"}
                    </span>
                    <ChevronDown className={`ml-auto w-4 h-4 text-slate-400 transition-transform shrink-0 ${storeDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {storeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            autoFocus
                            value={storeSearch}
                            onChange={e => setStoreSearch(e.target.value)}
                            placeholder="輸入門店名稱或地區篩選…"
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredStores.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-400">找不到符合的門店</div>
                        ) : filteredStores.map(s => {
                          const selected = selectedStoreIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleStore(s.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selected ? "bg-blue-50/60" : ""}`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900">{s.name}</div>
                                <div className="text-xs text-slate-400 truncate mt-0.5">
                                  <span className="text-blue-600">{s.district}</span> · {s.address}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {selectedStoreIds.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    請至少選擇一家門店。若尚未建立門店，請先前往「門店管理」新增。
                  </p>
                )}
              </div>
            </SectionCard>

            {/* ── Section 5: Recruitment Details ── */}
            <SectionCard index={5} title="招募詳情" desc="設定招募人數、薪酬範圍及職位有效期">
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

                <Field label={hiringType === "fulltime" ? "每月薪酬範圍" : "每小時薪酬範圍"} required>
                  <div className="space-y-2.5">
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
                      <span className="text-sm text-slate-500 shrink-0 w-14">
                        {hiringType === "fulltime" ? "/ 月" : "/ 小時"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {hiringType === "fulltime"
                        ? "全職職位以每月薪酬計算。若最低與最高相同，只顯示單一數字。"
                        : "兼職 / 臨時工職位以每小時薪酬計算。若最低與最高相同，只顯示單一數字。"}
                    </p>
                  </div>
                </Field>

                {/* Validity Period */}
                <Field label="職位有效期" required>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {VALIDITY_OPTIONS.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setValidityMonths(m); setValidityCustom(""); }}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            validityMonths === m && !validityCustom
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {m} 個月
                        </button>
                      ))}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">自訂</span>
                        <div className="relative w-20">
                          <input
                            type="number"
                            min={1}
                            max={12}
                            placeholder="月數"
                            value={validityCustom}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === "" || (Number(v) >= 1 && Number(v) <= 12)) setValidityCustom(v);
                            }}
                            className={`${inputClass} pr-8`}
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 pointer-events-none">月</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm text-slate-600">
                        預計截止日期：
                        <span className="font-semibold text-slate-900 ml-1">{expiryPreview}</span>
                      </span>
                      <span className="text-xs text-slate-400 ml-1">（{effectiveValidity} 個月後）</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      有效期最長不超過 12 個月，預設為 2 個月。到期後職位自動下架。
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

    </div>
  );
}
