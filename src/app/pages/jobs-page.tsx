import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Briefcase, Plus,
  MapPin, Users, X, AlertTriangle, CheckSquare,
  ChevronDown, Clock, Phone, Calendar, FileText,
  Award, Pencil, Save, ClipboardCheck, Store, MessageSquare,
  UserCheck, Hourglass, Info, Search, Check, Trash2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications } from "../contexts/notification-context";

// ── Types ──────────────────────────────────────────────────
type HiringType = "fulltime" | "parttime" | "temporary";
type JobStatus  = "active" | "unpublished" | "full";
type FilterTab  = "all" | JobStatus;

interface ShiftEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Applicant {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "男" | "女";
  education: string;
  appStatus: "待審核" | "已錄用" | "已拒絕" | "候選池";
  appType?: "normal" | "pool";
}

interface SiteConfig {
  siteId: string;
  siteName: string;
  district: string;
  address: string;
  shiftName: string;
  wage: string;
  wageMin?: number;      // fulltime: monthly min
  wageMax?: number;      // fulltime: monthly max
  overtimeWage?: string; // part-time/temp: overtime per hour
  mealBreak: boolean;
  regularCount: number;
  backupCount: number;
  regularFilled: number;
  applicants: Applicant[];
}

interface Job {
  id: string;
  title: string;
  store: string;
  district: string;
  hiringType: HiringType;
  status: JobStatus;
  wage: string;
  wageMin: number;
  wageMax: number;
  validityMonths: number;
  headcount: number;
  filled: number;
  applications: number;
  postedAt: string;
  expiryDate: string;
  // Detail fields
  jobCategory: string;
  jobDesc: string;
  certs: string[];
  workDays?: string[];
  workStart?: string;
  workEnd?: string;
  shifts?: ShiftEntry[];
  address: string;
  selectedStoreIds: string[];
  applicants: Applicant[];
  // Multi-site support
  sites?: SiteConfig[];
}

const MOCK_STORES = [
  { id: "S001", name: "旺角分店",   district: "旺角",   address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓" },
  { id: "S002", name: "中環分店",   district: "中環",   address: "香港中環皇后大道中 30 號娛樂行 G 樓" },
  { id: "S003", name: "尖沙咀分店", district: "尖沙咀", address: "香港九龍尖沙咀廣東道 17 號海港城" },
  { id: "S004", name: "葵涌倉庫",   district: "葵涌",   address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉" },
  { id: "S005", name: "觀塘辦公室", district: "觀塘",   address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓" },
  { id: "S006", name: "中環總部",   district: "中環",   address: "香港中環皇后大道中 15 號 20 樓" },
  { id: "S007", name: "銅鑼灣分店", district: "銅鑼灣", address: "香港銅鑼灣記利佐治街 2 號 Fashion Walk" },
  { id: "S008", name: "沙田分店",   district: "沙田",   address: "香港新界沙田新城市廣場 1 期 5 樓" },
];

const MOCK_SHIFTS_LIST = [
  "標準兼職班（週一至週五）","週末班次","全週晚班","彈性三天班","週末促銷班",
];

const CERT_SUGGESTIONS = [
  "電工證", "食品衛生證", "急救證", "駕駛執照（私家車）",
  "駕駛執照（貨車）", "叉車操作證", "保安牌", "物業管理證",
];

const VALIDITY_OPTIONS = [1, 2, 3, 6, 12];
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function buildWageStr(min: number, max: number, hiringType: HiringType): string {
  const unit = hiringType === "fulltime" ? "/ 月" : "/ 小時";
  const fmt = (n: number) => n.toLocaleString();
  return min === max ? `HK$ ${fmt(min)} ${unit}` : `HK$ ${fmt(min)}–${fmt(max)} ${unit}`;
}

// ── Mock data ──────────────────────────────────────────────
const INITIAL_JOBS: Job[] = [
  {
    id: "JOB-001", title: "收銀員", store: "旺角分店", district: "旺角",
    hiringType: "parttime", status: "active",
    wage: "HK$ 65 / 小時", wageMin: 65, wageMax: 65, validityMonths: 2,
    headcount: 3, filled: 1, applications: 12, postedAt: "2026-06-05", expiryDate: "2026-08-05",
    jobCategory: "零售 / 收銀", jobDesc: "負責收銀台日常操作，處理現金及電子支付，維持收銀區整潔，協助顧客查詢。要求態度友善、操作細心，具相關經驗者優先。",
    certs: [], workDays: ["mon","tue","wed","thu","fri"], workStart: "09:00", workEnd: "18:00",
    address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓", selectedStoreIds: ["S001"],
    applicants: [
      { id: "APP-001", name: "陳大文", phone: "+852 9123 4567", age: 28, gender: "男", education: "高級文憑", appStatus: "已錄用" },
      { id: "APP-002", name: "李小明", phone: "+852 6234 5678", age: 22, gender: "男", education: "副學士",   appStatus: "待審核" },
      { id: "APP-003", name: "張美儀", phone: "+852 5345 6789", age: 25, gender: "女", education: "中學",     appStatus: "待審核" },
      { id: "APP-004", name: "王志豪", phone: "+852 9456 7890", age: 31, gender: "男", education: "學士",     appStatus: "待審核" },
    ],
    sites: [
      { siteId:"S001", siteName:"旺角分店",   district:"旺角",   address:"香港九龍旺角彌敦道 608 號", shiftName:"標準兼職班", wage:"HK$ 65/h", overtimeWage:"HK$ 80/h", mealBreak:true,  regularCount:2, backupCount:1, regularFilled:1, applicants:[
        { id:"APP-001", name:"陳大文", phone:"+852 9123 4567", age:28, gender:"男", education:"高級文憑", appStatus:"已錄用" },
        { id:"APP-002", name:"李小明", phone:"+852 6234 5678", age:22, gender:"男", education:"副學士",   appStatus:"待審核" },
      ]},
      { siteId:"S003", siteName:"尖沙咀分店", district:"尖沙咀", address:"香港九龍尖沙咀廣東道 17 號", shiftName:"標準兼職班", wage:"HK$ 65/h", overtimeWage:"HK$ 80/h", mealBreak:false, regularCount:1, backupCount:1, regularFilled:0, applicants:[
        { id:"APP-003", name:"張美儀", phone:"+852 5345 6789", age:25, gender:"女", education:"中學",   appStatus:"待審核" },
        { id:"APP-004", name:"王志豪", phone:"+852 9456 7890", age:31, gender:"男", education:"學士",   appStatus:"待審核" },
      ]},
    ],
  },
  {
    id: "JOB-002", title: "倉務員", store: "葵涌倉庫", district: "葵涌",
    hiringType: "fulltime", status: "active",
    wage: "HK$ 18,000 / 月", wageMin: 18000, wageMax: 18000, validityMonths: 2,
    headcount: 2, filled: 0, applications: 5, postedAt: "2026-06-02", expiryDate: "2026-08-02",
    jobCategory: "物流 / 倉務", jobDesc: "負責倉庫貨品收發、整理及盤點，操作手推車及基本倉務設備，配合物流排班。需具備基本體力，持叉車操作證優先考慮。",
    certs: ["叉車操作證"], workDays: ["mon","tue","wed","thu","fri","sat"], workStart: "08:00", workEnd: "17:00",
    address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉", selectedStoreIds: ["S004"],
    applicants: [
      { id: "APP-005", name: "吳家俊", phone: "+852 9567 8901", age: 27, gender: "男", education: "中學",   appStatus: "待審核" },
      { id: "APP-006", name: "鄭偉明", phone: "+852 6678 9012", age: 34, gender: "男", education: "文憑",   appStatus: "待審核" },
    ],
  },
  {
    id: "JOB-003", title: "侍應生", store: "中環分店", district: "中環",
    hiringType: "temporary", status: "active",
    wage: "HK$ 70 / 小時", wageMin: 70, wageMax: 70, validityMonths: 2,
    headcount: 5, filled: 2, applications: 23, postedAt: "2026-06-07", expiryDate: "2026-08-07",
    jobCategory: "餐飲 / 廚房", jobDesc: "協助餐廳日常服務工作，包括接待客人、點餐、上菜及清理枱面。需具備基本廣東話溝通能力，具餐飲服務經驗者優先。",
    certs: ["食品衛生證"], workStart: "17:00", workEnd: "23:00",
    shifts: [
      { id: "s1", date: "2026-07-05", startTime: "17:00", endTime: "23:00" },
      { id: "s2", date: "2026-07-12", startTime: "17:00", endTime: "23:00" },
    ],
    address: "香港中環皇后大道中 30 號娛樂行 G 樓", selectedStoreIds: ["S002"],
    applicants: [
      { id: "APP-007", name: "黃曉恩", phone: "+852 5789 0123", age: 24, gender: "女", education: "副學士",   appStatus: "已錄用" },
      { id: "APP-008", name: "林嘉慧", phone: "+852 9890 1234", age: 29, gender: "女", education: "學士",     appStatus: "已錄用" },
      { id: "APP-009", name: "梁志偉", phone: "+852 6901 2345", age: 33, gender: "男", education: "中學",     appStatus: "待審核" },
      { id: "APP-010", name: "謝麗珊", phone: "+852 5012 3456", age: 26, gender: "女", education: "文憑",     appStatus: "待審核" },
      { id: "APP-011", name: "何俊賢", phone: "+852 9123 4560", age: 38, gender: "男", education: "高級文憑", appStatus: "待審核" },
    ],
  },
  {
    id: "JOB-004", title: "推廣員", store: "尖沙咀分店", district: "尖沙咀",
    hiringType: "temporary", status: "full",
    wage: "HK$ 80 / 小時", wageMin: 80, wageMax: 80, validityMonths: 2,
    headcount: 4, filled: 4, applications: 11, postedAt: "2026-06-01", expiryDate: "2026-08-01",
    jobCategory: "銷售 / 推廣", jobDesc: "在指定地點推廣品牌產品，派發宣傳物料及介紹產品功能，形象端莊，具親和力。無需相關經驗，即場培訓。",
    certs: [],
    shifts: [
      { id: "s1", date: "2026-07-01", startTime: "10:00", endTime: "18:00" },
      { id: "s2", date: "2026-07-02", startTime: "10:00", endTime: "18:00" },
      { id: "s3", date: "2026-07-03", startTime: "10:00", endTime: "18:00" },
    ],
    address: "香港九龍尖沙咀廣東道 17 號海港城", selectedStoreIds: ["S003"],
    applicants: [
      { id: "APP-012", name: "蔡敏儀", phone: "+852 6234 5670", age: 23, gender: "女", education: "文憑",     appStatus: "已錄用", appType: "normal" },
      { id: "APP-013", name: "許志安", phone: "+852 9345 6781", age: 30, gender: "男", education: "副學士",   appStatus: "已錄用", appType: "normal" },
      { id: "APP-014", name: "盧嘉欣", phone: "+852 5456 7892", age: 21, gender: "女", education: "中學",     appStatus: "已錄用", appType: "normal" },
      { id: "APP-015", name: "鍾浩然", phone: "+852 9567 8903", age: 27, gender: "男", education: "高級文憑", appStatus: "已錄用", appType: "normal" },
      { id: "APP-020", name: "羅子謙", phone: "+852 9201 3344", age: 26, gender: "男", education: "副學士",   appStatus: "候選池", appType: "pool" },
      { id: "APP-021", name: "潘詠琳", phone: "+852 6312 4455", age: 22, gender: "女", education: "文憑",     appStatus: "候選池", appType: "pool" },
      { id: "APP-022", name: "葉偉豪", phone: "+852 5423 5566", age: 29, gender: "男", education: "高級文憑", appStatus: "候選池", appType: "pool" },
    ],
  },
  {
    id: "JOB-005", title: "清潔員", store: "觀塘辦公室", district: "觀塘",
    hiringType: "parttime", status: "unpublished",
    wage: "HK$ 55 / 小時", wageMin: 55, wageMax: 55, validityMonths: 2,
    headcount: 2, filled: 0, applications: 3, postedAt: "2026-05-20", expiryDate: "2026-07-20",
    jobCategory: "清潔 / 保潔", jobDesc: "負責辦公室日常清潔工作，包括清掃地板、清潔洗手間及公共區域。工作時間靈活，歡迎全職或兼職申請。",
    certs: [], workDays: ["mon","wed","fri"], workStart: "08:00", workEnd: "12:00",
    address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓", selectedStoreIds: ["S005"],
    applicants: [
      { id: "APP-016", name: "方翠珊", phone: "+852 6678 9014", age: 42, gender: "女", education: "中學", appStatus: "已拒絕" },
    ],
  },
  {
    id: "JOB-006", title: "客服代表", store: "中環總部", district: "中環",
    hiringType: "fulltime", status: "unpublished",
    wage: "HK$ 15,000–20,000 / 月", wageMin: 15000, wageMax: 20000, validityMonths: 2,
    headcount: 3, filled: 1, applications: 18, postedAt: "2026-04-15", expiryDate: "2026-06-15",
    jobCategory: "行政 / 文員", jobDesc: "處理客戶查詢、投訴及跟進工作，透過電話、電郵及即時通訊渠道與客戶保持溝通。需具備良好廣東話、普通話及基本英語能力。",
    certs: [], workDays: ["mon","tue","wed","thu","fri"], workStart: "09:00", workEnd: "18:00",
    address: "香港中環皇后大道中 15 號 20 樓", selectedStoreIds: ["S006"],
    applicants: [
      { id: "APP-017", name: "劉嘉穎", phone: "+852 5789 0125", age: 29, gender: "女", education: "學士",   appStatus: "已錄用" },
      { id: "APP-018", name: "陳俊傑", phone: "+852 9890 1236", age: 35, gender: "男", education: "副學士", appStatus: "已拒絕" },
      { id: "APP-019", name: "周美玲", phone: "+852 6901 2347", age: 26, gender: "女", education: "學士",   appStatus: "已拒絕" },
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
  "候選池": "bg-violet-50 text-violet-700 border-violet-200",
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

// ── Editable site card (for edit mode) ────────────────────
function EditableSiteCard({ site, hiringType, onUpdate, onRemove }: {
  site: SiteConfig; hiringType: HiringType;
  onUpdate: (s: SiteConfig) => void; onRemove: () => void;
}) {
  const isFulltime = hiringType === "fulltime";
  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const Lbl = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1"><div className="text-xs font-medium text-slate-600">{label}</div>{children}</div>
  );
  const wageMinNum = site.wageMin ?? 0;
  const wageMaxNum = site.wageMax ?? 0;
  const maxExceeds = isFulltime && wageMinNum > 0 && wageMaxNum > 0 && wageMaxNum > wageMinNum * 1.15;
  const parseN = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${maxExceeds ? "border-red-300 bg-red-50/20" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{site.siteName} · {site.district}</div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-start gap-1"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />{site.address}</div>
        </div>
        <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <Lbl label="班次">
        <div className="relative">
          <select value={site.shiftName} onChange={e => onUpdate({...site, shiftName: e.target.value})} className={`w-full ${cls} appearance-none cursor-pointer pr-8`}>
            {MOCK_SHIFTS_LIST.map(s => <option key={s}>{s}</option>)}
            <option value={site.shiftName}>{site.shiftName}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </Lbl>
      {isFulltime ? (
        <Lbl label="月薪範圍 *">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
                <input type="number" min={0} value={wageMinNum || ""} onChange={e => onUpdate({...site, wageMin: +e.target.value || 0})} className={`${cls} pl-10 w-full`} placeholder="最低月薪" /></div>
              <span className="text-slate-400 shrink-0">–</span>
              <div className="relative flex-1"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
                <input type="number" min={0} value={wageMaxNum || ""} onChange={e => onUpdate({...site, wageMax: +e.target.value || 0})} className={`${cls} pl-10 w-full`} placeholder="最高月薪" /></div>
              <span className="text-xs text-slate-400 shrink-0">/ 月</span>
            </div>
            {maxExceeds && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                最高月薪不能超過最低的 15%（上限 HK$ {Math.round(wageMinNum * 1.15).toLocaleString()}）
              </p>
            )}
          </div>
        </Lbl>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Lbl label="時薪 *">
            <div className="relative"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
              <input type="number" min={0} value={parseN(site.wage) || ""} onChange={e => onUpdate({...site, wage: e.target.value ? `HK$ ${e.target.value}/h` : ""})} className={`${cls} pl-10 w-full`} placeholder="時薪" /></div>
          </Lbl>
          <Lbl label="加班薪資（選填）">
            <div className="relative"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
              <input type="number" min={0} value={site.overtimeWage ? parseN(site.overtimeWage) || "" : ""} onChange={e => onUpdate({...site, overtimeWage: e.target.value ? `HK$ ${e.target.value}/h` : undefined})} className={`${cls} pl-10 w-full`} placeholder="加班時薪" /></div>
          </Lbl>
        </div>
      )}
      <Lbl label="飯鐘">
        <div className="flex gap-2">
          {([{val:true,l:"有飯鐘"},{val:false,l:"無飯鐘"}]).map(opt => (
            <button key={String(opt.val)} type="button" onClick={() => onUpdate({...site, mealBreak: opt.val})}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${site.mealBreak === opt.val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              {opt.l}
            </button>
          ))}
        </div>
      </Lbl>
      <Lbl label="招募人數 *">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 shrink-0">正式員工</span>
            <input type="number" min={0} value={site.regularCount} onChange={e => onUpdate({...site, regularCount: +e.target.value||0})} className={`${cls} w-16 text-center`} />
            <span className="text-xs text-slate-400">人</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 shrink-0">候補人員</span>
            <input type="number" min={0} value={site.backupCount} onChange={e => onUpdate({...site, backupCount: +e.target.value||0})} className={`${cls} w-16 text-center`} />
            <span className="text-xs text-slate-400">人</span>
          </div>
        </div>
      </Lbl>
    </div>
  );
}

// ── Add site dialog ────────────────────────────────────────
function AddSiteDialog({ hiringType, onClose, onAdd }: {
  hiringType: HiringType; onClose: () => void; onAdd: (s: SiteConfig) => void;
}) {
  const isFulltime = hiringType === "fulltime";
  const [storeId, setStoreId]     = useState("");
  const [shiftName, setShiftName] = useState(MOCK_SHIFTS_LIST[0]);
  const [wage, setWage]           = useState("");
  const [wageMin, setWageMin]     = useState("");
  const [wageMax, setWageMax]     = useState("");
  const [overtimeWage, setOvertime] = useState("");
  const [mealBreak, setMealBreak] = useState(true);
  const [regular, setRegular]     = useState("");
  const [backup, setBackup]       = useState("0");
  const store = MOCK_STORES.find(s => s.id === storeId);
  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const wMinN = parseFloat(wageMin)||0, wMaxN = parseFloat(wageMax)||0;
  const maxExceeds = isFulltime && wMinN > 0 && wMaxN > wMinN * 1.15;
  const canAdd = store && shiftName && regular && (isFulltime ? wageMin && wageMax && !maxExceeds : wage);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">新增工作網點</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">為此職位新增一個工作網點崗位</DialogDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">選擇工作網點 <span className="text-red-500">*</span></label>
            <div className="relative">
              <select value={storeId} onChange={e => setStoreId(e.target.value)} className={`w-full ${cls} appearance-none cursor-pointer pr-8`}>
                <option value="">請選擇網點</option>
                {MOCK_STORES.map(s => <option key={s.id} value={s.id}>{s.name} — {s.district}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            {store && <div className="text-xs text-slate-400 flex items-start gap-1"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />{store.address}</div>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">班次 <span className="text-red-500">*</span></label>
            <div className="relative">
              <select value={shiftName} onChange={e => setShiftName(e.target.value)} className={`w-full ${cls} appearance-none cursor-pointer pr-8`}>
                {MOCK_SHIFTS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          {isFulltime ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">月薪範圍 <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
                  <input type="number" value={wageMin} onChange={e => setWageMin(e.target.value)} className={`${cls} pl-10`} placeholder="最低" /></div>
                <span className="text-slate-400">–</span>
                <div className="relative flex-1"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
                  <input type="number" value={wageMax} onChange={e => setWageMax(e.target.value)} className={`${cls} pl-10`} placeholder="最高" /></div>
                <span className="text-xs text-slate-400 shrink-0">/ 月</span>
              </div>
              {maxExceeds && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />最高不超過最低的 15%（上限 HK$ {Math.round(wMinN*1.15).toLocaleString()}）</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">時薪 <span className="text-red-500">*</span></label>
                <div className="relative"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
                  <input type="number" value={wage} onChange={e => setWage(e.target.value)} className={`${cls} pl-10`} placeholder="時薪" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">加班薪資（選填）</label>
                <div className="relative"><span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none">HK$</span>
                  <input type="number" value={overtimeWage} onChange={e => setOvertime(e.target.value)} className={`${cls} pl-10`} placeholder="加班時薪" /></div>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">飯鐘</label>
            <div className="flex gap-2">
              {([{val:true,l:"有飯鐘"},{val:false,l:"無飯鐘"}]).map(opt => (
                <button key={String(opt.val)} type="button" onClick={() => setMealBreak(opt.val)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${mealBreak===opt.val?"border-blue-500 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">招募人數 <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="text-xs text-slate-600 shrink-0">正式員工</span><input type="number" min={0} value={regular} onChange={e => setRegular(e.target.value)} className={`${cls} w-16 text-center`} /><span className="text-xs text-slate-400">人</span></div>
              <div className="flex items-center gap-2"><span className="text-xs text-slate-600 shrink-0">候補人員</span><input type="number" min={0} value={backup} onChange={e => setBackup(e.target.value)} className={`${cls} w-16 text-center`} /><span className="text-xs text-slate-400">人</span></div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!canAdd}
            onClick={() => {
              if (!store) return;
              onAdd({
                siteId: `S-NEW-${Date.now()}`, siteName: store.name, district: store.district,
                address: store.address, shiftName,
                wage: isFulltime ? `HK$ ${wageMin}–${wageMax} / 月` : `HK$ ${wage}/h`,
                wageMin: isFulltime ? +wageMin : undefined, wageMax: isFulltime ? +wageMax : undefined,
                overtimeWage: !isFulltime && overtimeWage ? `HK$ ${overtimeWage}/h` : undefined,
                mealBreak, regularCount: +regular||0, backupCount: +backup||0,
                regularFilled: 0, applicants: [],
              });
              onClose();
            }}>
            新增網點
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Site panel (expandable per-site breakdown) ────────────
function SitePanel({ site, index, navigate, jobId }: { site: SiteConfig; index: number; navigate: (p: string) => void; jobId: string }) {
  const [open, setOpen] = useState(false);
  const remaining = site.regularCount - site.regularFilled;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">{index+1}</span>
          <div>
            <div className="text-sm font-semibold text-slate-900">{site.siteName} · {site.district}</div>
            <div className="text-xs text-slate-500 mt-0.5">{site.shiftName} · {site.wage}{site.mealBreak?" · 有飯鐘":" · 無飯鐘"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>正式 {site.regularCount} / 候補 {site.backupCount}</span>
            <span className={remaining === 0 ? "text-teal-600 font-medium" : "text-amber-600 font-medium"}>剩 {remaining}</span>
            <span>申請 {site.applicants.length}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open?"rotate-180":""}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />{site.address}
          </div>
          {site.applicants.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">此網點暫無申請記錄</div>
          ) : (
            <div className="space-y-2">
              {site.applicants.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">{a.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{a.name}</span>
                      <span className="text-xs text-slate-400">{a.age} 歲</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</div>
                  </div>
                  {a.appStatus === "待審核" ? (
                    <button onClick={() => navigate(`/talent?applicant=${a.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors shrink-0">
                      <ClipboardCheck className="w-3 h-3" />去審核
                    </button>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 ${APP_STATUS_COLORS[a.appStatus]}`}>{a.appStatus}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobDetailDrawer({ job, onClose, onSave }: { job: Job; onClose: () => void; onSave: (updated: Job) => void }) {
  const navigate = useNavigate();
  const isUnpublished = job.status === "unpublished";
  // Aggregate across sites if multi-site job
  const totalRegular  = job.sites ? job.sites.reduce((s, x) => s + x.regularCount, 0) : job.headcount;
  const totalBackup   = job.sites ? job.sites.reduce((s, x) => s + x.backupCount, 0) : 0;
  const totalFilled   = job.sites ? job.sites.reduce((s, x) => s + x.regularFilled, 0) : job.filled;
  const totalApps     = job.sites ? job.sites.reduce((s, x) => s + x.applicants.length, 0) : job.applications;
  const remaining = totalRegular - totalFilled;
  const normalApplicants = job.applicants.filter(a => a.appType !== "pool");
  const poolApplicants   = job.applicants.filter(a => a.appType === "pool");
  const [editing, setEditing]     = useState(isUnpublished);
  // Convert legacy job fields to a SiteConfig when no explicit sites exist
  const legacySite = (): SiteConfig => ({
    siteId: `SITE-${job.id}`,
    siteName: job.store,
    district: job.district,
    address: job.address,
    shiftName: (job.workDays?.length && job.workStart && job.workEnd)
      ? `${job.workDays.map(d => WEEKDAY_MAP[d]).join("、")} · ${job.workStart}–${job.workEnd}`
      : (job.workStart && job.workEnd ? `${job.workStart}–${job.workEnd}` : "請設定班次"),
    wage: job.wage,
    wageMin: job.hiringType === "fulltime" ? job.wageMin : undefined,
    wageMax: job.hiringType === "fulltime" ? job.wageMax : undefined,
    overtimeWage: undefined,
    mealBreak: true,
    regularCount: job.headcount,
    backupCount: 0,
    regularFilled: job.filled,
    applicants: job.applicants.filter(a => a.appType !== "pool"),
  });
  const initialSites = job.sites && job.sites.length > 0 ? job.sites : [legacySite()];
  const [draftSites, setDraftSites] = useState<SiteConfig[]>(initialSites);
  const [showAddSite, setShowAddSite] = useState(false);
  const [draft, setDraft] = useState<Job>(job);
  const [draftWageMin, setDraftWageMin] = useState(String(job.wageMin));
  const [draftWageMax, setDraftWageMax] = useState(String(job.wageMax));
  const [draftValidityMonths, setDraftValidityMonths] = useState(job.validityMonths);
  const [draftValidityCustom, setDraftValidityCustom] = useState("");
  // Certs
  const [draftCerts, setDraftCerts] = useState<string[]>(job.certs);
  const [draftCertInput, setDraftCertInput] = useState("");
  // Shifts (temporary)
  const [draftShifts, setDraftShifts] = useState<ShiftEntry[]>(
    job.shifts?.length ? job.shifts : [{ id: "s-new", date: "", startTime: "", endTime: "" }]
  );
  // Store multi-select
  const [draftSelectedStoreIds, setDraftSelectedStoreIds] = useState<string[]>(job.selectedStoreIds ?? []);
  const [draftStoreSearch, setDraftStoreSearch] = useState("");
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) {
        setStoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const effectiveValidity = draftValidityCustom ? Number(draftValidityCustom) : draftValidityMonths;
  const expiryPreview = addMonths(draft.postedAt, effectiveValidity);

  const addDraftCert = (val: string) => {
    const t = val.trim();
    if (t && !draftCerts.includes(t)) setDraftCerts(p => [...p, t]);
    setDraftCertInput("");
  };
  const removeDraftCert = (c: string) => setDraftCerts(p => p.filter(x => x !== c));

  const addDraftShift = () =>
    setDraftShifts(p => [...p, { id: Date.now().toString(), date: "", startTime: "", endTime: "" }]);
  const removeDraftShift = (id: string) => {
    if (draftShifts.length === 1) return;
    setDraftShifts(p => p.filter(s => s.id !== id));
  };
  const updateDraftShift = (id: string, field: keyof ShiftEntry, value: string) =>
    setDraftShifts(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));

  const toggleDraftStore = (id: string) =>
    setDraftSelectedStoreIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filteredStores = MOCK_STORES.filter(s =>
    s.name.includes(draftStoreSearch) || s.district.includes(draftStoreSearch)
  );

  const handleSave = () => {
    const wMin = Number(draftWageMin) || 0;
    const wMax = Number(draftWageMax) || 0;
    const vMonths = effectiveValidity;
    const primaryStore = MOCK_STORES.find(s => s.id === draftSelectedStoreIds[0]);
    const saved: Job = {
      ...draft,
      certs: draftCerts,
      shifts: draft.hiringType === "temporary" ? draftShifts : undefined,
      selectedStoreIds: draftSelectedStoreIds,
      store: primaryStore?.name ?? draft.store,
      district: primaryStore?.district ?? draft.district,
      address: primaryStore?.address ?? draft.address,
      wageMin: wMin,
      wageMax: wMax,
      validityMonths: vMonths,
      wage: buildWageStr(wMin, wMax, draft.hiringType),
      expiryDate: addMonths(draft.postedAt, vMonths),
    };
    // Include updated sites if present
    if (draftSites.length > 0) {
      saved.sites = draftSites;
      saved.headcount = draftSites.reduce((s, x) => s + x.regularCount, 0);
    }
    onSave(saved);
    setEditing(false);
  };
  const handleCancel = () => {
    setDraft(job);
    setDraftCerts(job.certs);
    setDraftCertInput("");
    setDraftShifts(job.shifts?.length ? job.shifts : [{ id: "s-new", date: "", startTime: "", endTime: "" }]);
    setDraftSelectedStoreIds(job.selectedStoreIds ?? []);
    setDraftStoreSearch("");
    setDraftWageMin(String(job.wageMin));
    setDraftWageMax(String(job.wageMax));
    setDraftValidityMonths(job.validityMonths);
    setDraftValidityCustom("");
    setDraftSites(job.sites && job.sites.length > 0 ? job.sites : [legacySite()]);
    setEditing(false);
  };

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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${
                  isUnpublished
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}>
                  <Pencil className="w-3 h-3" />
                  {isUnpublished ? "編輯並重新發布" : "編輯中"}
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
          <div className={`px-6 py-4 grid gap-3 border-b border-slate-100 ${totalBackup > 0 || poolApplicants.length > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
            {[
              { label: "正式招募", value: `${editing ? draft.headcount : totalRegular} 人`, icon: <Users className="w-4 h-4 text-blue-500" /> },
              { label: "候補名額", value: `${editing ? 0 : totalBackup} 人`, icon: <Users className="w-4 h-4 text-violet-500" /> },
              { label: "剩餘名額", value: `${remaining} 人`, icon: <Users className="w-4 h-4 text-amber-500" />, highlight: remaining === 0 },
              { label: "收到申請", value: `${totalApps} 人`, icon: <FileText className="w-4 h-4 text-green-500" /> },
              ...(poolApplicants.length > 0 ? [{ label: "候選池", value: `${poolApplicants.length} 人`, icon: <Hourglass className="w-4 h-4 text-violet-500" />, isPool: true }] : []),
            ].map(m => (
              <div key={m.label} className={`rounded-xl p-3 text-center ${"isPool" in m && m.isPool ? "bg-violet-50 border border-violet-100" : "bg-slate-50"}`}>
                <div className="flex items-center justify-center mb-1.5">{m.icon}</div>
                <div className={`text-xl font-semibold ${"highlight" in m && m.highlight ? "text-teal-600" : "isPool" in m && m.isPool ? "text-violet-700" : "text-slate-900"}`}>{m.value}</div>
                <div className={`text-xs mt-0.5 ${"isPool" in m && m.isPool ? "text-violet-500" : "text-slate-500"}`}>{m.label}</div>
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

              

              {/* Multi-site breakdown */}
              {job.sites && job.sites.length > 0 ? (
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">工作網點崗位</div>
                  <div className="text-xs text-slate-400 mb-4">共 {job.sites.length} 個網點 · 正式 {totalRegular} 人 · 候補 {totalBackup} 人</div>
                  <div className="space-y-3">
                    {job.sites.map((site, si) => (
                      <SitePanel key={site.siteId} site={site} index={si} navigate={navigate} jobId={job.id} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">工作網點資訊</div>
                  <div className="space-y-3">
                    <Row label="工作網點"><span className="text-sm text-slate-700">{job.store}</span></Row>
                    <Row label="詳細地址">
                      <div className="flex items-start gap-1.5 text-sm text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />{job.address}
                      </div>
                    </Row>
                  </div>
                </div>
              )}

              <div className="px-6 py-5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">招募詳情</div>
                <div className="space-y-3">
                  <Row label="正式員工"><span className="text-sm font-semibold text-slate-900">{totalRegular} 人</span></Row>
                  {totalBackup > 0 && <Row label="候補人員"><span className="text-sm font-semibold text-slate-900">{totalBackup} 人</span></Row>}
                  <Row label="薪酬範圍"><span className="text-sm font-semibold text-slate-900">{job.wage}</span></Row>
                  <Row label="職位有效期">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span>{job.validityMonths} 個月</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">截止 {job.expiryDate}</span>
                    </div>
                  </Row>
                </div>
              </div>

              {/* Applicants (only shown for single-site jobs) */}
              {!job.sites && <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">申請記錄</div>
                  <span className="text-xs text-slate-500">{normalApplicants.length} 位申請者</span>
                </div>
                {normalApplicants.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-400">暫無正式申請記錄</div>
                ) : (
                  <div className="space-y-2">
                    {normalApplicants.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                          {a.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{a.name}</span>
                            <span className="text-xs text-slate-400">{a.age} 歲</span>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${
                              a.gender === "女"
                                ? "bg-pink-50 text-pink-600 border-pink-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}>{a.gender}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>
                            <span className="text-slate-300">·</span>
                            <span>{a.education}</span>
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

                {/* Candidate Pool Section */}
                {poolApplicants.length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200">
                        <Hourglass className="w-3 h-3 text-violet-600" />
                        <span className="text-xs font-semibold text-violet-700">候選池</span>
                        <span className="text-xs text-violet-500">{poolApplicants.length} 人</span>
                      </div>
                      <span className="text-xs text-slate-400">如有正式員工臨時缺席，可從候選池快速補位</span>
                    </div>
                    <div className="space-y-2">
                      {poolApplicants.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 bg-violet-50/60 rounded-xl border border-violet-100">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-semibold shrink-0">
                            {a.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{a.name}</span>
                              <span className="text-xs text-slate-400">{a.age} 歲</span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${
                                a.gender === "女"
                                  ? "bg-pink-50 text-pink-600 border-pink-200"
                                  : "bg-blue-50 text-blue-600 border-blue-200"
                              }`}>{a.gender}</span>
                              {a.appStatus === "候選池" && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-violet-600 font-medium">候選池</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>
                              <span className="text-slate-300">·</span>
                              <span>{a.education}</span>
                            </div>
                          </div>
                          {a.appStatus === "候選池" ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => navigate(`/talent?applicant=${a.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-green-300 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                              >
                                <UserCheck className="w-3 h-3" />直接錄用
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 ${APP_STATUS_COLORS[a.appStatus]}`}>
                              {a.appStatus}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>}
            </>
          ) : (
            /* ── EDIT mode ── */
            <div className="px-6 py-5 space-y-6">

              {/* ① 職位基本資料 — 對應創建職位第一步 */}
              <EditSection index={1} title="職位基本資料">
                <div className="space-y-4">
                  <EditField label="職位名稱">
                    <input className={inputCls} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
                  </EditField>
                  <EditField label="招聘方式">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-3 py-1.5 rounded-lg border text-sm font-medium ${HIRING_COLORS[draft.hiringType]}`}>
                        {HIRING_LABELS[draft.hiringType]}
                      </span>
                      <span className="text-xs text-slate-400">（招聘方式不可修改）</span>
                    </div>
                  </EditField>
                  <EditField label="工作種類">
                    <div className="relative">
                      <select className={`${inputCls} appearance-none cursor-pointer pr-8`} value={draft.jobCategory}
                        onChange={e => setDraft(d => ({ ...d, jobCategory: e.target.value }))}>
                        <option value="">請選擇工作種類</option>
                        {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </EditField>
                  <EditField label="工作要求">
                    <textarea rows={4} className={`${inputCls} resize-none`} value={draft.jobDesc}
                      onChange={e => setDraft(d => ({ ...d, jobDesc: e.target.value }))} />
                  </EditField>
                  <EditField label="技能 / 證書要求">
                    <div className="space-y-2">
                      {draftCerts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {draftCerts.map(c => (
                            <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                              {c}<button type="button" onClick={() => removeDraftCert(c)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input className={inputCls} placeholder="輸入證書名稱後按 Enter" value={draftCertInput}
                          onChange={e => setDraftCertInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDraftCert(draftCertInput); } }} />
                        <button type="button" onClick={() => addDraftCert(draftCertInput)}
                          className="shrink-0 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">{CERT_SUGGESTIONS.filter(s => !draftCerts.includes(s)).map(s => (
                        <button key={s} type="button" onClick={() => addDraftCert(s)}
                          className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50">+ {s}</button>
                      ))}</div>
                    </div>
                  </EditField>
                </div>
              </EditSection>

              {/* ② 工作地點配置 — 可編輯各網點詳情 */}
              <EditSection index={2} title="工作地點配置">
                <div className="space-y-4">
                  {draftSites.length > 0 ? (
                    <div className="space-y-3">
                      {draftSites.map((site, idx) => (
                        <EditableSiteCard
                          key={site.siteId + idx}
                          site={site}
                          hiringType={draft.hiringType}
                          onUpdate={updated => setDraftSites(prev => prev.map((s, i) => i === idx ? updated : s))}
                          onRemove={() => setDraftSites(prev => prev.filter((_, i) => i !== idx))}
                        />
                      ))}
                      <button type="button" onClick={() => setShowAddSite(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                        <Plus className="w-4 h-4" />新增工作網點
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <EditField label="工作網點">
                        <div className="relative">
                          <select value={draftSelectedStoreIds[0] ?? ""} onChange={e => setDraftSelectedStoreIds(e.target.value ? [e.target.value] : [])} className={`w-full ${inputCls} appearance-none cursor-pointer pr-8`}>
                            <option value="">請選擇工作網點</option>
                            {MOCK_STORES.map(s => <option key={s.id} value={s.id}>{s.name} — {s.district}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        </div>
                      </EditField>
                      {draft.hiringType !== "temporary" ? (
                        <div className="space-y-4">
                          <EditField label="工作日">
                            <div className="grid grid-cols-7 gap-1">
                              {WEEKDAYS.map(day => (
                                <button key={day.key} type="button" onClick={() => toggleDraftDay(day.key)}
                                  className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${(draft.workDays ?? []).includes(day.key) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                                  {day.label}
                                </button>
                              ))}
                            </div>
                          </EditField>
                          <div className="grid grid-cols-2 gap-3">
                            <EditField label="上班時間"><input type="time" className={inputCls} value={draft.workStart ?? ""} onChange={e => setDraft(d => ({ ...d, workStart: e.target.value }))} /></EditField>
                            <EditField label="下班時間"><input type="time" className={inputCls} value={draft.workEnd ?? ""} onChange={e => setDraft(d => ({ ...d, workEnd: e.target.value }))} /></EditField>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {draftShifts.map((shift, idx) => (
                            <div key={shift.id} className="flex items-end gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <EditField label={`第 ${idx + 1} 日`}><input type="date" className={inputCls} value={shift.date} onChange={e => updateDraftShift(shift.id, "date", e.target.value)} /></EditField>
                                <EditField label="上班時間"><input type="time" className={inputCls} value={shift.startTime} onChange={e => updateDraftShift(shift.id, "startTime", e.target.value)} /></EditField>
                                <EditField label="下班時間"><input type="time" className={inputCls} value={shift.endTime} onChange={e => updateDraftShift(shift.id, "endTime", e.target.value)} /></EditField>
                              </div>
                              <button type="button" onClick={() => removeDraftShift(shift.id)} disabled={draftShifts.length === 1}
                                className="mb-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={addDraftShift}
                            className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                            <Plus className="w-3.5 h-3.5" />新增工作日期
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </EditSection>


            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between gap-3 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" onClick={isUnpublished ? onClose : handleCancel}>
                {isUnpublished ? "取消" : "取消修改"}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSave} className="gap-1.5">
                  <Save className="w-4 h-4" />儲存草稿
                </Button>
                {isUnpublished && (
                  <Button
                    onClick={() => {
                      const wMin = Number(draftWageMin) || 0;
                      const wMax = Number(draftWageMax) || 0;
                      const vMonths = effectiveValidity;
                      const primaryStore = MOCK_STORES.find(s => s.id === draftSelectedStoreIds[0]);
                      onSave({
                        ...draft,
                        status: "active",
                        certs: draftCerts,
                        shifts: draft.hiringType === "temporary" ? draftShifts : undefined,
                        selectedStoreIds: draftSelectedStoreIds,
                        store: primaryStore?.name ?? draft.store,
                        district: primaryStore?.district ?? draft.district,
                        address: primaryStore?.address ?? draft.address,
                        wageMin: wMin, wageMax: wMax,
                        validityMonths: vMonths,
                        wage: buildWageStr(wMin, wMax, draft.hiringType),
                        expiryDate: addMonths(draft.postedAt, vMonths),
                      });
                      onClose();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <CheckSquare className="w-4 h-4" />確認重新發布
                  </Button>
                )}
                {!isUnpublished && (
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Save className="w-4 h-4" />儲存修改
                  </Button>
                )}
              </div>
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

      {showAddSite && (
        <AddSiteDialog
          hiringType={draft.hiringType}
          onClose={() => setShowAddSite(false)}
          onAdd={site => { setDraftSites(prev => [...prev, site]); setShowAddSite(false); }}
        />
      )}
    </>
  );
}

function EditSection({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
          {index}
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
      </div>
      {children}
    </div>
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
  const { verificationStatus } = useNotifications();
  const [showVerifAlert, setShowVerifAlert] = useState(false);

  const [jobs, setJobs]               = useState<Job[]>(INITIAL_JOBS);
  const [activeTab, setActiveTab]     = useState<FilterTab>("all");
  const [storeFilter, setStoreFilter] = useState<string>(searchParams.get("store") ?? "all");
  const [bulkMode, setBulkMode]       = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm]           = useState(false);
  const [pendingUnpublishId, setPendingUnpublishId] = useState<string | null>(null);
  const [detailJob, setDetailJob]               = useState<Job | null>(null);

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
    if (pendingUnpublishId) {
      setJobs(prev => prev.map(j => j.id === pendingUnpublishId ? { ...j, status: "unpublished" } : j));
      setPendingUnpublishId(null);
    } else {
      setJobs(prev => prev.map(j => selected.has(j.id) ? { ...j, status: "unpublished" } : j));
      exitBulkMode();
    }
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

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
                    <option value="all">全部工作網點</option>
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
                <span className="text-xs text-slate-500">篩選工作網點：</span>
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
                <table className="w-full table-fixed min-w-[1080px] text-sm">
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
                      <th className="px-4 py-3 text-left w-[130px]">職位名稱</th>
                      <th className="px-4 py-3 text-left w-[110px]">工作网点</th>
                      <th className="px-4 py-3 text-left w-[80px]">招聘方式</th>
                      <th className="px-4 py-3 text-center w-[65px]">招聘人数</th>
                      <th className="px-4 py-3 text-center w-[65px]">正式剩餘</th>
                      <th className="px-4 py-3 text-center w-[65px]">候補剩餘</th>
                      <th className="px-4 py-3 text-center w-[68px]">申請</th>
                      <th className="px-4 py-3 text-left w-[96px]">狀態</th>
                      <th className="px-4 py-3 text-left w-[100px]">發佈時間</th>
                      <th className="px-4 py-3 text-left w-[100px]">截止時間</th>
                      <th className="px-4 py-3 text-left w-[110px]">操作</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={bulkMode ? 13 : 12} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                            <span className="text-sm">此分類下暫無職位</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((job, idx) => {
                        const isSelectable   = job.status !== "unpublished";
                        const isSelected     = selected.has(job.id);
                        const listRegular    = job.sites ? job.sites.reduce((s,x)=>s+x.regularCount,0) : job.headcount;
                        const listFilled     = job.sites ? job.sites.reduce((s,x)=>s+x.regularFilled,0) : job.filled;
                        const listApps       = job.sites ? job.sites.reduce((s,x)=>s+x.applicants.length,0) : job.applications;
                        const remaining      = listRegular - listFilled;
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
                            <td className="px-4 py-4">
                              <div className="text-sm text-slate-700">{job.store}</div>
                              {job.sites && job.sites.length > 1 && <div className="text-[10px] text-blue-500 mt-0.5 font-medium">{job.sites.length} 個網點</div>}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${HIRING_COLORS[job.hiringType]}`}>
                                {HIRING_LABELS[job.hiringType]}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div>
                                <span className="text-sm font-medium text-slate-900">{listRegular}</span>
                                <span className="text-xs text-slate-400 ml-0.5">人</span>
                              </div>
                              {job.sites && job.sites.reduce((s,x)=>s+x.backupCount,0) > 0 && (
                                <div className="text-[10px] text-violet-600 font-medium mt-0.5">+{job.sites.reduce((s,x)=>s+x.backupCount,0)} 候補</div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-sm font-semibold ${remaining === 0 ? "text-teal-600" : remaining <= 1 ? "text-amber-600" : "text-slate-900"}`}>
                                {remaining}
                              </span>
                              <span className="text-xs text-slate-400 ml-0.5">人</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {job.sites ? (
                                <span className={`text-sm font-semibold ${job.sites.reduce((s,x)=>s+(x.backupCount-Math.max(0,x.backupCount-(x.regularCount-x.regularFilled<0?0:0))),0) === 0 ? "text-slate-300" : "text-violet-600"}`}>
                                  {job.sites.reduce((s,x)=>s+x.backupCount,0)}
                                </span>
                              ) : <span className="text-sm text-slate-300">—</span>}
                              <span className="text-xs text-slate-400 ml-0.5">人</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-medium">{listApps}</span>
                                </div>
                                {job.applicants.filter(a => a.appType === "pool").length > 0 && (
                                  <div className="flex items-center gap-0.5 text-[10px] text-violet-600 font-medium">
                                    <Hourglass className="w-2.5 h-2.5" />
                                    {job.applicants.filter(a => a.appType === "pool").length}
                                  </div>
                                )}
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
                              {(() => {
                                const isExpired = job.expiryDate < new Date().toISOString().slice(0, 10);
                                return (
                                  <span className={`text-sm tabular-nums ${
                                    isExpired
                                      ? "text-red-500 font-medium"
                                      : "text-slate-500"
                                  }`}>
                                    {job.expiryDate}
                                    {isExpired && <span className="block text-[10px] text-red-400 font-normal">已過期</span>}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-4">
                              {job.status === "unpublished" ? (
                                <button
                                  onClick={() => setDetailJob(job)}
                                  className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors whitespace-nowrap"
                                >
                                  編輯並重新發佈
                                </button>
                              ) : (
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => setDetailJob(job)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors whitespace-nowrap"
                                  >
                                    管理
                                  </button>
                                  <button
                                    onClick={() => { setPendingUnpublishId(job.id); setShowConfirm(true); }}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors whitespace-nowrap"
                                  >
                                    下架
                                  </button>
                                </div>
                              )}
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
      <Dialog open={showConfirm} onOpenChange={v => { setShowConfirm(v); if (!v) setPendingUnpublishId(null); }}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              {pendingUnpublishId
                ? `確認下架「${jobs.find(j => j.id === pendingUnpublishId)?.title ?? ""}」？`
                : `確認下架 ${selected.size} 個職位？`}
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
