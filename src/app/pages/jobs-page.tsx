import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Briefcase, Building2, LayoutDashboard, Plus,
  MapPin, Users, X, AlertTriangle, CheckSquare,
  ChevronDown, Clock, Phone, Calendar, FileText,
  Award, Pencil, Save, ClipboardCheck, Store, MessageSquare,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications } from "../contexts/notification-context";

// ── Types ──────────────────────────────────────────────────
type HiringType = "fulltime" | "parttime" | "temporary";
type JobStatus  = "active" | "unpublished" | "full";
type FilterTab  = "all" | JobStatus;

interface Applicant {
  id: string;
  name: string;
  phone: string;
  appliedAt: string;
  appStatus: "待審核" | "已錄用" | "已拒絕";
}

interface Job {
  id: string;
  title: string;
  store: string;
  district: string;
  hiringType: HiringType;
  status: JobStatus;
  wage: string;
  headcount: number;
  filled: number;
  applications: number;
  postedAt: string;
  // Detail fields
  jobCategory: string;
  jobDesc: string;
  certs: string[];
  workDays?: string[];
  workStart?: string;
  workEnd?: string;
  address: string;
  applicants: Applicant[];
}

// ── Mock data ──────────────────────────────────────────────
const INITIAL_JOBS: Job[] = [
  {
    id: "JOB-001", title: "收銀員", store: "旺角分店", district: "旺角",
    hiringType: "parttime", status: "active",
    wage: "HK$ 65 / 小時", headcount: 3, filled: 1, applications: 12, postedAt: "2026-06-05",
    jobCategory: "零售 / 收銀", jobDesc: "負責收銀台日常操作，處理現金及電子支付，維持收銀區整潔，協助顧客查詢。要求態度友善、操作細心，具相關經驗者優先。",
    certs: [], workDays: ["mon","tue","wed","thu","fri"], workStart: "09:00", workEnd: "18:00",
    address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓",
    applicants: [
      { id: "APP-001", name: "陳大文", phone: "+852 9123 4567", appliedAt: "2026-06-06", appStatus: "已錄用" },
      { id: "APP-002", name: "李小明", phone: "+852 6234 5678", appliedAt: "2026-06-07", appStatus: "待審核" },
      { id: "APP-003", name: "張美儀", phone: "+852 5345 6789", appliedAt: "2026-06-08", appStatus: "待審核" },
      { id: "APP-004", name: "王志豪", phone: "+852 9456 7890", appliedAt: "2026-06-08", appStatus: "待審核" },
    ],
  },
  {
    id: "JOB-002", title: "倉務員", store: "葵涌倉庫", district: "葵涌",
    hiringType: "fulltime", status: "active",
    wage: "HK$ 18,000 / 月", headcount: 2, filled: 0, applications: 5, postedAt: "2026-06-02",
    jobCategory: "物流 / 倉務", jobDesc: "負責倉庫貨品收發、整理及盤點，操作手推車及基本倉務設備，配合物流排班。需具備基本體力，持叉車操作證優先考慮。",
    certs: ["叉車操作證"], workDays: ["mon","tue","wed","thu","fri","sat"], workStart: "08:00", workEnd: "17:00",
    address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉",
    applicants: [
      { id: "APP-005", name: "吳家俊", phone: "+852 9567 8901", appliedAt: "2026-06-03", appStatus: "待審核" },
      { id: "APP-006", name: "鄭偉明", phone: "+852 6678 9012", appliedAt: "2026-06-04", appStatus: "待審核" },
    ],
  },
  {
    id: "JOB-003", title: "侍應生", store: "中環分店", district: "中環",
    hiringType: "temporary", status: "active",
    wage: "HK$ 70 / 小時", headcount: 5, filled: 2, applications: 23, postedAt: "2026-06-07",
    jobCategory: "餐飲 / 廚房", jobDesc: "協助餐廳日常服務工作，包括接待客人、點餐、上菜及清理枱面。需具備基本廣東話溝通能力，具餐飲服務經驗者優先。",
    certs: ["食品衛生證"], workStart: "17:00", workEnd: "23:00",
    address: "香港中環皇后大道中 30 號娛樂行 G 樓",
    applicants: [
      { id: "APP-007", name: "黃曉恩", phone: "+852 5789 0123", appliedAt: "2026-06-08", appStatus: "已錄用" },
      { id: "APP-008", name: "林嘉慧", phone: "+852 9890 1234", appliedAt: "2026-06-08", appStatus: "已錄用" },
      { id: "APP-009", name: "梁志偉", phone: "+852 6901 2345", appliedAt: "2026-06-09", appStatus: "待審核" },
      { id: "APP-010", name: "謝麗珊", phone: "+852 5012 3456", appliedAt: "2026-06-09", appStatus: "待審核" },
      { id: "APP-011", name: "何俊賢", phone: "+852 9123 4560", appliedAt: "2026-06-09", appStatus: "待審核" },
    ],
  },
  {
    id: "JOB-004", title: "推廣員", store: "尖沙咀分店", district: "尖沙咀",
    hiringType: "temporary", status: "full",
    wage: "HK$ 80 / 小時", headcount: 4, filled: 4, applications: 11, postedAt: "2026-06-01",
    jobCategory: "銷售 / 推廣", jobDesc: "在指定地點推廣品牌產品，派發宣傳物料及介紹產品功能，形象端莊，具親和力。無需相關經驗，即場培訓。",
    certs: [],
    address: "香港九龍尖沙咀廣東道 17 號海港城",
    applicants: [
      { id: "APP-012", name: "蔡敏儀", phone: "+852 6234 5670", appliedAt: "2026-06-02", appStatus: "已錄用" },
      { id: "APP-013", name: "許志安", phone: "+852 9345 6781", appliedAt: "2026-06-02", appStatus: "已錄用" },
      { id: "APP-014", name: "盧嘉欣", phone: "+852 5456 7892", appliedAt: "2026-06-03", appStatus: "已錄用" },
      { id: "APP-015", name: "鍾浩然", phone: "+852 9567 8903", appliedAt: "2026-06-03", appStatus: "已錄用" },
    ],
  },
  {
    id: "JOB-005", title: "清潔員", store: "觀塘辦公室", district: "觀塘",
    hiringType: "parttime", status: "unpublished",
    wage: "HK$ 55 / 小時", headcount: 2, filled: 0, applications: 3, postedAt: "2026-05-20",
    jobCategory: "清潔 / 保潔", jobDesc: "負責辦公室日常清潔工作，包括清掃地板、清潔洗手間及公共區域。工作時間靈活，歡迎全職或兼職申請。",
    certs: [], workDays: ["mon","wed","fri"], workStart: "08:00", workEnd: "12:00",
    address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓",
    applicants: [
      { id: "APP-016", name: "方翠珊", phone: "+852 6678 9014", appliedAt: "2026-05-21", appStatus: "已拒絕" },
    ],
  },
  {
    id: "JOB-006", title: "客服代表", store: "中環總部", district: "中環",
    hiringType: "fulltime", status: "unpublished",
    wage: "HK$ 15,000–20,000 / 月", headcount: 3, filled: 1, applications: 18, postedAt: "2026-04-15",
    jobCategory: "行政 / 文員", jobDesc: "處理客戶查詢、投訴及跟進工作，透過電話、電郵及即時通訊渠道與客戶保持溝通。需具備良好廣東話、普通話及基本英語能力。",
    certs: [], workDays: ["mon","tue","wed","thu","fri"], workStart: "09:00", workEnd: "18:00",
    address: "香港中環皇后大道中 15 號 20 樓",
    applicants: [
      { id: "APP-017", name: "劉嘉穎", phone: "+852 5789 0125", appliedAt: "2026-04-16", appStatus: "已錄用" },
      { id: "APP-018", name: "陳俊傑", phone: "+852 9890 1236", appliedAt: "2026-04-17", appStatus: "已拒絕" },
      { id: "APP-019", name: "周美玲", phone: "+852 6901 2347", appliedAt: "2026-04-18", appStatus: "已拒絕" },
    ],
  },
];

// ── Config ─────────────────────────────────────────────────
const HIRING_LABELS: Record<HiringType, string> = { fulltime: "全職", parttime: "兼職", temporary: "臨時工" };
const HIRING_COLORS: Record<HiringType, string> = {
  fulltime:  "bg-blue-50 text-blue-700 border-blue-200",
  parttime:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  temporary: "bg-violet-50 text-violet-700 border-violet-200",
};
const STATUS_LABELS: Record<JobStatus, string> = { active: "招募中", unpublished: "已下架", full: "已招滿" };
const STATUS_COLORS: Record<JobStatus, string> = {
  active:      "bg-amber-50 text-amber-700 border-amber-200",
  unpublished: "bg-slate-100 text-slate-500 border-slate-200",
  full:        "bg-teal-50 text-teal-700 border-teal-200",
};
const STATUS_DOTS: Record<JobStatus, string>   = { active: "bg-amber-500 animate-pulse", unpublished: "bg-slate-400", full: "bg-teal-500" };

const APP_STATUS_COLORS: Record<Applicant["appStatus"], string> = {
  "待審核": "bg-amber-50 text-amber-700 border-amber-200",
  "已錄用": "bg-green-50 text-green-700 border-green-200",
  "已拒絕": "bg-red-50 text-red-600 border-red-200",
};

const JOB_CATEGORIES = [
  "零售 / 收銀", "餐飲 / 廚房", "服務 / 接待", "銷售 / 推廣",
  "物流 / 倉務", "清潔 / 保潔", "保安 / 守衛", "行政 / 文員",
  "IT / 技術支援", "教育 / 補習", "美容 / 護理", "其他",
];

const WEEKDAYS = [
  { key: "mon", label: "週一" },
  { key: "tue", label: "週二" },
  { key: "wed", label: "週三" },
  { key: "thu", label: "週四" },
  { key: "fri", label: "週五" },
  { key: "sat", label: "週六" },
  { key: "sun", label: "週日" },
];

const WEEKDAY_MAP: Record<string, string> = {
  mon: "週一", tue: "週二", wed: "週三", thu: "週四", fri: "週五", sat: "週六", sun: "週日",
};

const TAB_LABELS: { key: FilterTab; label: string }[] = [
  { key: "all",         label: "全部" },
  { key: "active",      label: "招募中" },
  { key: "unpublished", label: "已下架" },
  { key: "full",        label: "已招滿" },
];

// ── Detail Drawer ──────────────────────────────────────────
const inputCls = "w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function JobDetailDrawer({ job, onClose, onSave }: { job: Job; onClose: () => void; onSave: (updated: Job) => void }) {
  const navigate = useNavigate();
  const remaining = job.headcount - job.filled;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Job>(job);

  const handleSave = () => { onSave(draft); setEditing(false); };
  const handleCancel = () => { setDraft(job); setEditing(false); };

  const toggleDraftDay = (key: string) => {
    setDraft(d => {
      const days = d.workDays ?? [];
      return { ...d, workDays: days.includes(key) ? days.filter(x => x !== key) : [...days, key] };
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={editing ? undefined : onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-[540px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 font-mono">{job.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLORS[job.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[job.status]}`} />
                {STATUS_LABELS[job.status]}
              </span>
              {editing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                  <Pencil className="w-3 h-3" />編輯中
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 truncate">{editing ? draft.title : job.title}</h2>
            <div className="flex items-center gap-1 mt-0.5 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {job.store} · {job.district}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-3 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Key metrics */}
          <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-slate-100">
            {[
              { label: "招募人數", value: `${editing ? draft.headcount : job.headcount} 人`, icon: <Users className="w-4 h-4 text-blue-500" /> },
              { label: "剩餘名額", value: `${remaining} 人`, icon: <Users className="w-4 h-4 text-amber-500" />, highlight: remaining === 0 },
              { label: "收到申請", value: `${job.applications} 人`, icon: <FileText className="w-4 h-4 text-green-500" /> },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1.5">{m.icon}</div>
                <div className={`text-xl font-semibold ${m.highlight ? "text-teal-600" : "text-slate-900"}`}>{m.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* ── VIEW mode ── */}
          {!editing ? (
            <>
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">職位詳情</div>
                <div className="space-y-3">
                  <Row label="招聘方式">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${HIRING_COLORS[job.hiringType]}`}>
                      {HIRING_LABELS[job.hiringType]}
                    </span>
                  </Row>
                  <Row label="工作種類"><span className="text-sm text-slate-700">{job.jobCategory}</span></Row>
                  {job.certs.length > 0 && (
                    <Row label="技能證書">
                      <div className="flex flex-wrap gap-1.5">
                        {job.certs.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                            <Award className="w-3 h-3" />{c}
                          </span>
                        ))}
                      </div>
                    </Row>
                  )}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">工作要求</div>
                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">{job.jobDesc}</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">工作時間</div>
                <div className="space-y-3">
                  {job.workDays && job.workDays.length > 0 && (
                    <Row label="工作日">
                      <div className="flex flex-wrap gap-1">
                        {job.workDays.map(d => (
                          <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">{WEEKDAY_MAP[d]}</span>
                        ))}
                      </div>
                    </Row>
                  )}
                  {job.workStart && job.workEnd && (
                    <Row label="工作時段">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {job.workStart} – {job.workEnd}
                      </div>
                    </Row>
                  )}
                </div>
              </div>

              <div className="px-6 py-5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">門店資訊</div>
                <div className="space-y-3">
                  <Row label="門店名稱"><span className="text-sm text-slate-700">{job.store}</span></Row>
                  <Row label="詳細地址">
                    <div className="flex items-start gap-1.5 text-sm text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />{job.address}
                    </div>
                  </Row>
                </div>
              </div>

              <div className="px-6 py-5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">招募資訊</div>
                <Row label="招募人數"><span className="text-sm font-semibold text-slate-900">{job.headcount} 人</span></Row>
              </div>

              {/* Applicants */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">申請記錄</div>
                  <span className="text-xs text-slate-500">{job.applicants.length} 位申請者</span>
                </div>
                {job.applicants.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">暫無申請記錄</div>
                ) : (
                  <div className="space-y-2">
                    {job.applicants.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                          {a.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{a.name}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3" />{a.phone}
                            <span className="text-slate-300 mx-1">·</span>
                            <Calendar className="w-3 h-3" />{a.appliedAt}
                          </div>
                        </div>
                        {a.appStatus === "待審核" ? (
                          <button
                            onClick={() => navigate(`/talent?applicant=${a.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors shrink-0"
                          >
                            <ClipboardCheck className="w-3 h-3" />去審核
                          </button>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 ${APP_STATUS_COLORS[a.appStatus]}`}>
                            {a.appStatus}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── EDIT mode ── */
            <div className="px-6 py-5 space-y-6">

              {/* 職位基本資料 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">職位基本資料</div>
                <div className="space-y-4">
                  <EditField label="職位名稱">
                    <input className={inputCls} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
                  </EditField>
                  <EditField label="招聘方式">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: "fulltime", label: "全職" },
                        { value: "parttime", label: "兼職" },
                        { value: "temporary", label: "臨時工" },
                      ] as { value: HiringType; label: string }[]).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDraft(d => ({ ...d, hiringType: opt.value }))}
                          className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                            draft.hiringType === opt.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </EditField>
                </div>
              </div>

              {/* 工作時間 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">工作時間</div>
                <div className="space-y-4">
                  {draft.hiringType !== "temporary" && (
                    <EditField label="工作日">
                      <div className="grid grid-cols-7 gap-1">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => toggleDraftDay(day.key)}
                            className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              (draft.workDays ?? []).includes(day.key)
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </EditField>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="上班時間">
                      <input type="time" className={inputCls} value={draft.workStart ?? ""} onChange={e => setDraft(d => ({ ...d, workStart: e.target.value }))} />
                    </EditField>
                    <EditField label="下班時間">
                      <input type="time" className={inputCls} value={draft.workEnd ?? ""} onChange={e => setDraft(d => ({ ...d, workEnd: e.target.value }))} />
                    </EditField>
                  </div>
                </div>
              </div>

              {/* 職位詳情 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">職位詳情</div>
                <div className="space-y-4">
                  <EditField label="工作種類">
                    <div className="relative">
                      <select
                        className={`${inputCls} appearance-none cursor-pointer pr-8`}
                        value={draft.jobCategory}
                        onChange={e => setDraft(d => ({ ...d, jobCategory: e.target.value }))}
                      >
                        <option value="">請選擇工作種類</option>
                        {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </EditField>
                  <EditField label="工作要求">
                    <textarea
                      rows={4}
                      className={`${inputCls} resize-none`}
                      value={draft.jobDesc}
                      onChange={e => setDraft(d => ({ ...d, jobDesc: e.target.value }))}
                    />
                  </EditField>
                </div>
              </div>

              {/* 門店資訊 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">門店資訊</div>
                <div className="space-y-4">
                  <EditField label="門店名稱">
                    <input className={inputCls} value={draft.store} onChange={e => setDraft(d => ({ ...d, store: e.target.value }))} />
                  </EditField>
                  <EditField label="詳細地址">
                    <input className={inputCls} value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
                  </EditField>
                </div>
              </div>

              {/* 招募資訊 */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">招募資訊</div>
                <EditField label="招募人數">
                  <div className="relative w-36">
                    <input
                      type="number" min={1}
                      className={inputCls}
                      value={draft.headcount}
                      onChange={e => setDraft(d => ({ ...d, headcount: Number(e.target.value) || d.headcount }))}
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-slate-400 pointer-events-none">人</span>
                  </div>
                </EditField>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between gap-3 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>取消修改</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Save className="w-4 h-4" />儲存修改
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>關閉</Button>
              <Button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Pencil className="w-4 h-4" />修改資訊
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-xs text-slate-500 w-20 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function JobsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unreadTalentCount, unreadCount, verificationStatus } = useNotifications();
  const [showVerifAlert, setShowVerifAlert] = useState(false);

  const [jobs, setJobs]               = useState<Job[]>(INITIAL_JOBS);
  const [activeTab, setActiveTab]     = useState<FilterTab>("all");
  const [storeFilter, setStoreFilter] = useState<string>(searchParams.get("store") ?? "all");
  const [bulkMode, setBulkMode]       = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [detailJob, setDetailJob]     = useState<Job | null>(null);

  const allStores = Array.from(new Set(jobs.map(j => j.store))).sort();

  const filtered = jobs
    .filter(j => activeTab === "all" || j.status === activeTab)
    .filter(j => storeFilter === "all" || j.store === storeFilter);

  const storeJobs = storeFilter === "all" ? jobs : jobs.filter(j => j.store === storeFilter);
  const tabCount = (key: FilterTab) =>
    key === "all" ? storeJobs.length : storeJobs.filter(j => j.status === key).length;

  const selectableIds = filtered.filter(j => j.status !== "unpublished").map(j => j.id);
  const allSelected   = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); selectableIds.forEach(id => n.delete(id)); return n; });
    else             setSelected(prev => { const n = new Set(prev); selectableIds.forEach(id => n.add(id)); return n; });
  };

  const enterBulkMode = () => { setBulkMode(true); setSelected(new Set()); };
  const exitBulkMode  = () => { setBulkMode(false); setSelected(new Set()); };

  const confirmUnpublish = () => {
    setJobs(prev => prev.map(j => selected.has(j.id) ? { ...j, status: "unpublished" } : j));
    setShowConfirm(false);
    exitBulkMode();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ── */}
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
              { key: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "工作台",  path: "/dashboard", badge: 0 },
              { key: "jobs",          icon: <Briefcase className="w-5 h-5" />,     label: "職位管理", path: "/jobs",          badge: 0 },
              { key: "talent",        icon: <Users className="w-5 h-5" />,         label: "人才管理", path: "/talent",        badge: unreadTalentCount },
              { key: "stores",        icon: <Store className="w-5 h-5" />,         label: "門店管理", path: "/stores",        badge: 0 },
              { key: "notifications", icon: <MessageSquare className="w-5 h-5" />, label: "消息中心", path: "/notifications", badge: unreadCount },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.key === "jobs" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">職位管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理所有已發佈及歷史職位</p>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-full">
            {/* Filter tabs + store filter + action buttons */}
            <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
              {TAB_LABELS.map(tab => (
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
                    {tabCount(tab.key)}
                  </span>
                  {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
                </button>
              ))}
              {/* Spacer */}
              <div className="flex-1" />
              {/* Store filter */}
              {!bulkMode && (
                <div className="relative mb-1">
                  <select
                    value={storeFilter}
                    onChange={e => setStoreFilter(e.target.value)}
                    className="h-8 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="all">全部門店</option>
                    {allStores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2 w-4 h-4 text-slate-400" />
                </div>
              )}
              {/* Bulk / Create buttons */}
              <div className="flex items-center gap-2 mb-1">
                {bulkMode ? (
                  <>
                    <span className="text-sm text-slate-600">
                      已選 <span className="font-semibold text-slate-900">{selected.size}</span> 個職位
                    </span>
                    <Button variant="outline" onClick={exitBulkMode} className="gap-1.5 h-8 text-xs">
                      <X className="w-3.5 h-3.5" />取消
                    </Button>
                    <Button
                      disabled={selected.size === 0}
                      onClick={() => setShowConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white gap-1.5 h-8 text-xs disabled:opacity-40"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      確認下架 ({selected.size})
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={enterBulkMode} className="gap-1.5 h-8 text-xs border-slate-200 text-slate-600">
                      <CheckSquare className="w-3.5 h-3.5" />批量下架
                    </Button>
                    <Button
                      onClick={() => {
                        if (verificationStatus === "unverified" || verificationStatus === "pending") {
                          setShowVerifAlert(true);
                        } else {
                          navigate("/create-job");
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />創建職位
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Active store filter indicator */}
            {storeFilter !== "all" && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">篩選門店：</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                  {storeFilter}
                  <button onClick={() => setStoreFilter("all")} className="hover:text-blue-900 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[960px] text-sm">
                  {/* Head */}
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {bulkMode && (
                        <th className="pl-5 pr-2 py-3 w-10">
                          <button
                            onClick={toggleSelectAll}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              allSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400"
                            }`}
                          >
                            {allSelected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                          </button>
                        </th>
                      )}
                      <th className="px-4 py-3 text-left w-[96px]">職位 ID</th>
                      <th className="px-4 py-3 text-left w-[140px]">職位名稱</th>
                      <th className="px-4 py-3 text-left w-[120px]">門店</th>
                      <th className="px-4 py-3 text-left w-[88px]">招聘方式</th>
                      <th className="px-4 py-3 text-center w-[68px]">招募</th>
                      <th className="px-4 py-3 text-center w-[68px]">剩餘</th>
                      <th className="px-4 py-3 text-center w-[68px]">申請</th>
                      <th className="px-4 py-3 text-left w-[100px]">狀態</th>
                      <th className="px-4 py-3 text-left w-[104px]">發佈時間</th>
                      <th className="px-4 py-3 text-left w-[60px]">操作</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={bulkMode ? 11 : 10} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                            <span className="text-sm">此分類下暫無職位</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((job, idx) => {
                        const isSelectable = job.status !== "unpublished";
                        const isSelected   = selected.has(job.id);
                        const remaining    = job.headcount - job.filled;
                        return (
                          <tr
                            key={job.id}
                            className={`border-b border-slate-100 last:border-0 transition-colors ${
                              isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                            }`}
                          >
                            {bulkMode && (
                              <td className="pl-5 pr-2 py-4">
                                <button
                                  onClick={() => isSelectable && toggleSelect(job.id)}
                                  disabled={!isSelectable}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    !isSelectable
                                      ? "border-slate-200 opacity-30 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-slate-300 hover:border-blue-400"
                                  }`}
                                >
                                  {isSelected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                                </button>
                              </td>
                            )}
                            <td className="px-4 py-4">
                              <span className="text-xs font-mono text-slate-400">{job.id}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-slate-900">{job.title}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">{job.store}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${HIRING_COLORS[job.hiringType]}`}>
                                {HIRING_LABELS[job.hiringType]}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-sm font-medium text-slate-900">{job.headcount}</span>
                              <span className="text-xs text-slate-400 ml-0.5">人</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-sm font-semibold ${remaining === 0 ? "text-teal-600" : remaining <= 1 ? "text-amber-600" : "text-slate-900"}`}>
                                {remaining}
                              </span>
                              <span className="text-xs text-slate-400 ml-0.5">人</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium">{job.applications}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${STATUS_COLORS[job.status]}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOTS[job.status]}`} />
                                {STATUS_LABELS[job.status]}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-500 tabular-nums">{job.postedAt}</td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => setDetailJob(job)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors whitespace-nowrap"
                              >
                                管理
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {filtered.length > 0 && (
              <div className="mt-3 text-xs text-slate-400 text-right">共 {filtered.length} 個職位</div>
            )}
          </div>
        </main>
      </div>

      {/* ── Job Detail Drawer ── */}
      {detailJob && (
        <JobDetailDrawer
          job={detailJob}
          onClose={() => setDetailJob(null)}
          onSave={updated => {
            setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
            setDetailJob(updated);
          }}
        />
      )}

      {/* ── Bulk confirm dialog ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              確認下架 {selected.size} 個職位？
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              下架後職位將停止接受申請，求職者無法再搜尋到這些職位。
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>取消</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmUnpublish}>確認下架</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Verification guard dialog ── */}
      <Dialog open={showVerifAlert} onOpenChange={setShowVerifAlert}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              verificationStatus === "pending" ? "bg-amber-50" : "bg-amber-50"
            }`}>
              {verificationStatus === "pending"
                ? <div className="w-6 h-6 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
                : <AlertTriangle className="w-7 h-7 text-amber-500" />
              }
            </div>
            <DialogTitle className="text-base font-semibold text-slate-900 mb-1">
              {verificationStatus === "pending" ? "商戶資料審核中" : "請先完成商戶認證"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              {verificationStatus === "pending"
                ? "您的商戶資料正在審核中，預計 1–2 個工作天完成。審核通過後即可發布職位。"
                : "發布職位需要先完成商戶資料認證，請前往工作台完成認證流程。"
              }
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setShowVerifAlert(false)}>
              關閉
            </Button>
            {verificationStatus === "unverified" && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => { setShowVerifAlert(false); navigate("/merchant-profile"); }}
              >
                前往認證
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
