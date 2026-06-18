import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText, Users, Search, X, Filter, ChevronDown, Clock,
  MapPin, Phone, Calendar, CheckCircle2, XCircle, Hourglass,
  Building2,
} from "lucide-react";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Sidebar } from "../components/Sidebar";

// ── Types ──────────────────────────────────────────────────
type WorkStatus = "在職" | "已完成" | "已離職" | "異常終止";

interface WorkRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  phone: string;
  gender: "男" | "女";
  age: number;
  jobId: string;
  jobTitle: string;
  hiringType: "全職" | "兼職" | "臨時工";
  store: string;
  district: string;
  startDate: string;
  endDate?: string;
  status: WorkStatus;
  totalDays?: number;
  wage: string;
}

// ── Mock data ──────────────────────────────────────────────
const MOCK_WORK_RECORDS: WorkRecord[] = [
  {
    id: "WR-001", employeeId: "APP-001", employeeName: "陳大文", phone: "+852 9123 4567", gender: "男", age: 28,
    jobId: "JOB-001", jobTitle: "收銀員", hiringType: "兼職", store: "旺角分店", district: "旺角",
    startDate: "2026-06-10", status: "在職", wage: "HK$ 65 / 小時",
  },
  {
    id: "WR-002", employeeId: "APP-007", employeeName: "黃曉恩", phone: "+852 5789 0123", gender: "女", age: 24,
    jobId: "JOB-003", jobTitle: "侍應生", hiringType: "臨時工", store: "中環分店", district: "中環",
    startDate: "2026-07-05", endDate: "2026-07-12", status: "已完成", totalDays: 2, wage: "HK$ 70 / 小時",
  },
  {
    id: "WR-003", employeeId: "APP-008", employeeName: "林嘉慧", phone: "+852 9890 1234", gender: "女", age: 27,
    jobId: "JOB-003", jobTitle: "侍應生", hiringType: "臨時工", store: "中環分店", district: "中環",
    startDate: "2026-07-05", endDate: "2026-07-12", status: "已完成", totalDays: 2, wage: "HK$ 70 / 小時",
  },
  {
    id: "WR-004", employeeId: "APP-012", employeeName: "蔡敏儀", phone: "+852 6234 5670", gender: "女", age: 25,
    jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店", district: "尖沙咀",
    startDate: "2026-07-01", endDate: "2026-07-03", status: "已完成", totalDays: 3, wage: "HK$ 80 / 小時",
  },
  {
    id: "WR-005", employeeId: "APP-013", employeeName: "許志安", phone: "+852 9345 6781", gender: "男", age: 30,
    jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店", district: "尖沙咀",
    startDate: "2026-07-01", endDate: "2026-07-03", status: "已完成", totalDays: 3, wage: "HK$ 80 / 小時",
  },
  {
    id: "WR-006", employeeId: "APP-014", employeeName: "盧嘉欣", phone: "+852 5456 7892", gender: "女", age: 21,
    jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店", district: "尖沙咀",
    startDate: "2026-07-01", endDate: "2026-07-02", status: "異常終止", wage: "HK$ 80 / 小時",
  },
  {
    id: "WR-007", employeeId: "APP-017", employeeName: "劉嘉穎", phone: "+852 5789 0125", gender: "女", age: 29,
    jobId: "JOB-006", jobTitle: "客服代表", hiringType: "全職", store: "中環總部", district: "中環",
    startDate: "2026-05-01", status: "在職", wage: "HK$ 18,000 / 月",
  },
  {
    id: "WR-008", employeeId: "APP-015", employeeName: "鍾浩然", phone: "+852 9567 8903", gender: "男", age: 27,
    jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店", district: "尖沙咀",
    startDate: "2026-07-01", endDate: "2026-07-03", status: "已完成", totalDays: 3, wage: "HK$ 80 / 小時",
  },
];

// ── Config ─────────────────────────────────────────────────
const STATUS_COLORS: Record<WorkStatus, string> = {
  "在職":   "bg-green-50 text-green-700 border-green-200",
  "已完成": "bg-blue-50 text-blue-700 border-blue-200",
  "已離職": "bg-slate-100 text-slate-500 border-slate-200",
  "異常終止": "bg-red-50 text-red-600 border-red-200",
};
const STATUS_DOTS: Record<WorkStatus, string> = {
  "在職":   "bg-green-500 animate-pulse",
  "已完成": "bg-blue-400",
  "已離職": "bg-slate-400",
  "異常終止": "bg-red-500",
};
const HIRING_COLORS: Record<WorkRecord["hiringType"], string> = {
  "全職":   "bg-blue-50 text-blue-700 border-blue-200",
  "兼職":   "bg-indigo-50 text-indigo-700 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-700 border-violet-200",
};

type StatusFilter = "all" | WorkStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all",    label: "全部" },
  { key: "在職",   label: "在職" },
  { key: "已完成", label: "已完成" },
  { key: "已離職", label: "已離職" },
  { key: "異常終止", label: "異常終止" },
];

function FilterSelect({ value, onChange, label, children }: {
  value: string; onChange: (v: string) => void;
  label: string; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-8 pl-3 pr-7 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors ${
          value !== "all" ? "border-blue-400 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600"
        }`}
      >
        <option value="all">{label}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 w-4 h-4 text-slate-400" />
    </div>
  );
}

// ── Summary cards ──────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: {
  label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm mt-0.5">{label}</div>
      {sub && <div className="text-xs mt-0.5 opacity-70">{sub}</div>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function WorkRecordsPage() {
  const [records] = useState<WorkRecord[]>(MOCK_WORK_RECORDS);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [hiringFilter, setHiringFilter] = useState("all");
  const [detailRecord, setDetailRecord] = useState<WorkRecord | null>(null);

  const allStores = Array.from(new Set(records.map(r => r.store))).sort();

  const filtered = records.filter(r => {
    const matchTab   = activeTab === "all" || r.status === activeTab;
    const matchStore = storeFilter === "all" || r.store === storeFilter;
    const matchHire  = hiringFilter === "all" || r.hiringType === hiringFilter;
    const matchSearch = !search || r.employeeName.includes(search) || r.phone.includes(search) || r.jobTitle.includes(search);
    return matchTab && matchStore && matchHire && matchSearch;
  });

  const countByStatus = (s: StatusFilter) =>
    s === "all" ? records.length : records.filter(r => r.status === s).length;

  const activeCount   = records.filter(r => r.status === "在職").length;
  const completedCount = records.filter(r => r.status === "已完成").length;
  const abnormalCount = records.filter(r => r.status === "異常終止").length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">工作記錄</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理所有錄用員工的在職及歷史工作狀態</p>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-full">

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <SummaryCard label="總工作記錄" value={records.length} color="bg-white border-slate-200 text-slate-900" />
              <SummaryCard label="當前在職" value={activeCount} sub="實時更新" color="bg-green-50 border-green-200 text-green-800" />
              <SummaryCard label="已完成" value={completedCount} color="bg-blue-50 border-blue-200 text-blue-800" />
              <SummaryCard label="異常終止" value={abnormalCount} color="bg-red-50 border-red-200 text-red-800" />
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="搜尋姓名、電話或職位…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <FilterSelect value={storeFilter} onChange={setStoreFilter} label="全部門店">
                  {allStores.map(s => <option key={s} value={s}>{s}</option>)}
                </FilterSelect>
                <FilterSelect value={hiringFilter} onChange={setHiringFilter} label="招聘方式">
                  <option value="全職">全職</option>
                  <option value="兼職">兼職</option>
                  <option value="臨時工">臨時工</option>
                </FilterSelect>
                {(storeFilter !== "all" || hiringFilter !== "all") && (
                  <button
                    onClick={() => { setStoreFilter("all"); setHiringFilter("all"); }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />清除篩選
                  </button>
                )}
              </div>
            </div>

            {/* Status tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium relative transition-colors ${
                    activeTab === tab.key ? "text-blue-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {countByStatus(tab.key)}
                  </span>
                  {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[1000px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-[130px]">員工</th>
                      <th className="px-4 py-3 text-center w-[50px]">性別</th>
                      <th className="px-4 py-3 text-center w-[50px]">年齡</th>
                      <th className="px-4 py-3 text-left w-[130px]">聯絡電話</th>
                      <th className="px-4 py-3 text-left w-[110px]">職位</th>
                      <th className="px-4 py-3 text-left w-[80px]">方式</th>
                      <th className="px-4 py-3 text-left w-[110px]">門店</th>
                      <th className="px-4 py-3 text-left w-[100px]">開始日期</th>
                      <th className="px-4 py-3 text-left w-[100px]">結束日期</th>
                      <th className="px-4 py-3 text-left w-[90px]">狀態</th>
                      <th className="px-4 py-3 text-left w-[80px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <FileText className="w-8 h-8 text-slate-300" />
                            <span className="text-sm">暫無符合條件的工作記錄</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map(r => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                              r.gender === "女" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {r.employeeName[0]}
                            </div>
                            <span className="font-medium text-slate-900">{r.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${
                            r.gender === "女" ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>{r.gender}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm text-slate-700">{r.age}</td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums text-sm">{r.phone}</td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-900 font-medium text-sm">{r.jobTitle}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{r.jobId}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${HIRING_COLORS[r.hiringType]}`}>
                            {r.hiringType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm text-slate-700">{r.store}</div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{r.district}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 tabular-nums">{r.startDate}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 tabular-nums">
                          {r.endDate ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOTS[r.status]}`} />
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setDetailRecord(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                          >
                            <FileText className="w-3 h-3" />詳情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filtered.length > 0 && (
              <div className="mt-3 text-xs text-slate-400 text-right">共 {filtered.length} 條記錄</div>
            )}

          </div>
        </main>
      </div>

      {/* Detail panel */}
      {detailRecord && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetailRecord(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400 font-mono">{detailRecord.id}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLORS[detailRecord.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[detailRecord.status]}`} />
                    {detailRecord.status}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{detailRecord.employeeName}</h2>
              </div>
              <button onClick={() => setDetailRecord(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Employee info */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">員工資料</div>
                <div className="space-y-2.5">
                  <DetailRow label="姓名">{detailRecord.employeeName}</DetailRow>
                  <DetailRow label="性別">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                      detailRecord.gender === "女" ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>{detailRecord.gender}</span>
                  </DetailRow>
                  <DetailRow label="年齡">{detailRecord.age} 歲</DetailRow>
                  <DetailRow label="聯絡電話">
                    <span className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3 text-slate-400" />{detailRecord.phone}</span>
                  </DetailRow>
                </div>
              </div>
              {/* Job info */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">工作資訊</div>
                <div className="space-y-2.5">
                  <DetailRow label="職位名稱">{detailRecord.jobTitle}</DetailRow>
                  <DetailRow label="招聘方式">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${HIRING_COLORS[detailRecord.hiringType]}`}>
                      {detailRecord.hiringType}
                    </span>
                  </DetailRow>
                  <DetailRow label="門店">
                    <span className="flex items-center gap-1 text-sm"><MapPin className="w-3 h-3 text-slate-400" />{detailRecord.store} · {detailRecord.district}</span>
                  </DetailRow>
                  <DetailRow label="薪酬">{detailRecord.wage}</DetailRow>
                </div>
              </div>
              {/* Timeline */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">工作時段</div>
                <div className="space-y-2.5">
                  <DetailRow label="開始日期">
                    <span className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3 text-slate-400" />{detailRecord.startDate}</span>
                  </DetailRow>
                  <DetailRow label="結束日期">
                    {detailRecord.endDate
                      ? <span className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3 text-slate-400" />{detailRecord.endDate}</span>
                      : <span className="text-sm text-slate-400">進行中</span>}
                  </DetailRow>
                  {detailRecord.totalDays != null && (
                    <DetailRow label="工作天數">{detailRecord.totalDays} 天</DetailRow>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-xs text-slate-500 w-18 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-sm text-slate-700">{children}</div>
    </div>
  );
}
