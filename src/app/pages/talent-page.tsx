import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Users, Search, Phone, Calendar, ClipboardCheck, CheckCircle2,
  XCircle, X, Filter, FileText, GraduationCap, Briefcase as BriefcaseIcon,
  Award, Globe, Star, ChevronRight, ChevronDown,
  Hourglass, UserCheck, Settings, RotateCcw, History,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { CANDIDATE_HISTORY_MAP, getHistoryStats } from "../data/candidateHistory";
import { HistoryPanel } from "../components/HistoryPanel";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications } from "../contexts/notification-context";

// ── Types ──────────────────────────────────────────────────
type AppStatus = "待審核" | "已錄用" | "已拒絕" | "候選池" | "已撤回";

interface Applicant {
  id: string;
  name: string;
  phone: string;
  appliedAt: string;
  jobId: string;
  jobTitle: string;
  store: string;
  appStatus: AppStatus;
  appType?: "normal" | "pool";
}

interface Education {
  school: string;
  major: string;
  level: string;
  period: string;
}

interface WorkExperience {
  company: string;
  position: string;
  period: string;
  description: string;
}

interface Certificate {
  name: string;
  remark: string;
  imageUrl?: string;
}

interface CandidateResume {
  applicantId: string;
  gender: "男" | "女";
  age: number;
  languages: string[];
  summary: string;
  education: Education[];
  workExperience: WorkExperience[];
  certificates: Certificate[];
}

// ── Mock data ──────────────────────────────────────────────
const MOCK_APPLICANTS: Applicant[] = [
  { id: "APP-001", name: "陳大文", phone: "+852 9123 4567", appliedAt: "2026-06-06", jobId: "JOB-001", jobTitle: "收銀員",   store: "旺角分店",   appStatus: "已錄用" },
  { id: "APP-002", name: "李小明", phone: "+852 6234 5678", appliedAt: "2026-06-07", jobId: "JOB-001", jobTitle: "收銀員",   store: "旺角分店",   appStatus: "待審核" },
  { id: "APP-003", name: "張美儀", phone: "+852 5345 6789", appliedAt: "2026-06-08", jobId: "JOB-001", jobTitle: "收銀員",   store: "旺角分店",   appStatus: "待審核" },
  { id: "APP-004", name: "王志豪", phone: "+852 9456 7890", appliedAt: "2026-06-08", jobId: "JOB-001", jobTitle: "收銀員",   store: "旺角分店",   appStatus: "待審核" },
  { id: "APP-005", name: "吳家俊", phone: "+852 9567 8901", appliedAt: "2026-06-03", jobId: "JOB-002", jobTitle: "倉務員",   store: "葵涌倉庫",   appStatus: "待審核" },
  { id: "APP-006", name: "鄭偉明", phone: "+852 6678 9012", appliedAt: "2026-06-04", jobId: "JOB-002", jobTitle: "倉務員",   store: "葵涌倉庫",   appStatus: "待審核" },
  { id: "APP-007", name: "黃曉恩", phone: "+852 5789 0123", appliedAt: "2026-06-08", jobId: "JOB-003", jobTitle: "侍應生",   store: "中環分店",   appStatus: "已錄用" },
  { id: "APP-008", name: "林嘉慧", phone: "+852 9890 1234", appliedAt: "2026-06-08", jobId: "JOB-003", jobTitle: "侍應生",   store: "中環分店",   appStatus: "已錄用" },
  { id: "APP-009", name: "梁志偉", phone: "+852 6901 2345", appliedAt: "2026-06-09", jobId: "JOB-003", jobTitle: "侍應生",   store: "中環分店",   appStatus: "待審核" },
  { id: "APP-010", name: "謝麗珊", phone: "+852 5012 3456", appliedAt: "2026-06-09", jobId: "JOB-003", jobTitle: "侍應生",   store: "中環分店",   appStatus: "待審核" },
  { id: "APP-011", name: "何俊賢", phone: "+852 9123 4560", appliedAt: "2026-06-09", jobId: "JOB-003", jobTitle: "侍應生",   store: "中環分店",   appStatus: "待審核" },
  { id: "APP-012", name: "蔡敏儀", phone: "+852 6234 5670", appliedAt: "2026-06-02", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "已錄用" },
  { id: "APP-013", name: "許志安", phone: "+852 9345 6781", appliedAt: "2026-06-02", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "已錄用" },
  { id: "APP-014", name: "盧嘉欣", phone: "+852 5456 7892", appliedAt: "2026-06-03", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "已錄用" },
  { id: "APP-015", name: "鍾浩然", phone: "+852 9567 8903", appliedAt: "2026-06-03", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "已錄用",  appType: "normal" },
  { id: "APP-020", name: "羅子謙", phone: "+852 9201 3344", appliedAt: "2026-06-04", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "候選池",  appType: "pool" },
  { id: "APP-021", name: "潘詠琳", phone: "+852 6312 4455", appliedAt: "2026-06-05", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "候選池",  appType: "pool" },
  { id: "APP-022", name: "葉偉豪", phone: "+852 5423 5566", appliedAt: "2026-06-05", jobId: "JOB-004", jobTitle: "推廣員",   store: "尖沙咀分店", appStatus: "候選池",  appType: "pool" },
  { id: "APP-016", name: "方翠珊", phone: "+852 6678 9014", appliedAt: "2026-05-21", jobId: "JOB-005", jobTitle: "清潔員",   store: "觀塘辦公室", appStatus: "已拒絕",  appType: "normal" },
  { id: "APP-017", name: "劉嘉穎", phone: "+852 5789 0125", appliedAt: "2026-04-16", jobId: "JOB-006", jobTitle: "客服代表", store: "中環總部",   appStatus: "已錄用" },
  { id: "APP-018", name: "陳俊傑", phone: "+852 9890 1236", appliedAt: "2026-04-17", jobId: "JOB-006", jobTitle: "客服代表", store: "中環總部",   appStatus: "已拒絕" },
  { id: "APP-019", name: "周美玲", phone: "+852 6901 2347", appliedAt: "2026-04-18", jobId: "JOB-006", jobTitle: "客服代表", store: "中環總部",   appStatus: "已拒絕" },
];

// Placeholder certificate image (a simple SVG document rendered as data URI)
const CERT_PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='420' viewBox='0 0 600 420'><rect width='600' height='420' fill='%23f8fafc'/><rect x='20' y='20' width='560' height='380' rx='8' fill='none' stroke='%23cbd5e1' stroke-width='2'/><rect x='40' y='40' width='520' height='340' rx='4' fill='none' stroke='%23e2e8f0' stroke-width='1' stroke-dasharray='6 3'/><rect x='220' y='60' width='160' height='50' rx='4' fill='%23dbeafe'/><text x='300' y='91' font-family='sans-serif' font-size='14' fill='%231d4ed8' text-anchor='middle' font-weight='bold'>CERTIFICATE</text><text x='300' y='160' font-family='sans-serif' font-size='11' fill='%2364748b' text-anchor='middle'>This certifies that</text><text x='300' y='195' font-family='sans-serif' font-size='18' fill='%230f172a' text-anchor='middle' font-weight='bold'>候選人姓名</text><line x1='160' y1='205' x2='440' y2='205' stroke='%23cbd5e1' stroke-width='1'/><text x='300' y='240' font-family='sans-serif' font-size='11' fill='%2364748b' text-anchor='middle'>has successfully completed</text><text x='300' y='270' font-family='sans-serif' font-size='13' fill='%231e293b' text-anchor='middle' font-weight='500'>專業資格認證課程</text><circle cx='300' cy='330' r='28' fill='%23fef9c3' stroke='%23eab308' stroke-width='2'/><text x='300' y='337' font-family='sans-serif' font-size='22' text-anchor='middle'>★</text><text x='300' y='395' font-family='sans-serif' font-size='10' fill='%2394a3b8' text-anchor='middle'>示範用途 · For Illustration Only</text></svg>`);

const MOCK_RESUMES: CandidateResume[] = [
  {
    applicantId: "APP-001",
    gender: "男", age: 28, languages: ["廣東話", "普通話", "英語"],
    summary: "具備三年零售收銀經驗，熟悉POS系統操作及現金管理。工作態度認真負責，溝通能力強，能在繁忙環境下保持效率。",
    education: [{ school: "香港職業訓練局", major: "零售管理", level: "高級文憑", period: "2016年09月–2018年06月" }],
    workExperience: [
      { company: "百佳超級市場", position: "收銀員", period: "2020年03月–2023年08月", description: "負責日常收銀工作，處理現金及電子支付，協助處理顧客退換貨事宜。" },
      { company: "惠康超市", position: "兼職收銀員", period: "2018年07月–2020年02月", description: "高峰時段支援收銀，維持收銀台秩序及顧客服務。" },
    ],
    certificates: [
      { name: "零售業銷售技巧證書", remark: "香港零售管理協會頒授，2019年", imageUrl: CERT_PLACEHOLDER },
      { name: "食品安全處理員證書", remark: "食物安全中心頒授，2020年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-002",
    gender: "男", age: 22, languages: ["廣東話", "普通話"],
    summary: "應屆畢業生，主修零售管理，學習能力強，積極上進。具備良好的數學運算能力及服務態度，期望在零售業發展。",
    education: [{ school: "香港專業教育學院", major: "工商管理", level: "副學士", period: "2022年09月–2024年06月" }],
    workExperience: [
      { company: "7-Eleven", position: "兼職店員", period: "2023年06月–2024年05月", description: "負責收銀、補貨及清潔工作，累積零售服務經驗。" },
    ],
    certificates: [
      { name: "收銀員操作培訓證書", remark: "零售業訓練局頒授，2023年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-003",
    gender: "女", age: 26, languages: ["廣東話", "英語", "普通話"],
    summary: "具兩年收銀及客服經驗，擅長處理顧客投訴，服務態度親切。熟悉多種電子支付系統，能快速適應新系統。",
    education: [{ school: "香港理工大學", major: "酒店及旅遊管理", level: "學士學位", period: "2018年09月–2022年06月" }],
    workExperience: [
      { company: "屈臣氏", position: "銷售員及收銀", period: "2022年08月–2024年05月", description: "提供美容產品諮詢，處理收銀及會員積分事宜，維護門店秩序。" },
    ],
    certificates: [
      { name: "急救員資格證書", remark: "香港紅十字會頒授，2021年", imageUrl: CERT_PLACEHOLDER },
      { name: "服務業優質顧客服務資格", remark: "效率促進組頒授，2022年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-004",
    gender: "男", age: 31, languages: ["廣東話", "普通話"],
    summary: "擁有五年零售管理及收銀經驗，熟悉庫存管理及團隊協作。曾擔任代班主管，具備基本管理能力。",
    education: [{ school: "香港城市大學", major: "市場學", level: "學士學位", period: "2013年09月–2017年06月" }],
    workExperience: [
      { company: "莎莎國際", position: "高級銷售員", period: "2021年03月–2026年02月", description: "負責門店日常運作、銷售目標達成及新員工培訓。" },
      { company: "萬寧", position: "收銀員", period: "2017年07月–2021年02月", description: "處理收銀及顧客服務，協助存貨盤點。" },
    ],
    certificates: [
      { name: "零售管理文憑", remark: "香港管理專業協會頒授，2020年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-005",
    gender: "男", age: 35, languages: ["廣東話", "普通話"],
    summary: "具六年倉務及物流操作經驗，熟悉叉車操作及倉庫管理系統。工作認真，體力充沛，適應輪班工作。",
    education: [{ school: "職業訓練局", major: "物流及供應鏈管理", level: "職業訓練證書", period: "2008年09月–2010年06月" }],
    workExperience: [
      { company: "順豐速運", position: "倉務主任", period: "2019年04月–2025年03月", description: "負責倉庫日常運作，管理收發貨流程，帶領五人倉務團隊。" },
      { company: "DHL快遞", position: "倉務員", period: "2014年06月–2019年03月", description: "進行貨物分揀、裝卸及庫存盤點工作。" },
    ],
    certificates: [
      { name: "叉車操作員牌照", remark: "機電工程署發出，2015年考獲", imageUrl: CERT_PLACEHOLDER },
      { name: "危險品處理資格", remark: "勞工處認可，2018年考獲", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-006",
    gender: "男", age: 29, languages: ["廣東話", "英語"],
    summary: "有三年倉務及配送工作經驗，熟悉貨物分類及庫存管理，工作細心，能準時完成任務。",
    education: [{ school: "香港專業教育學院", major: "物流管理", level: "高級文憑", period: "2015年09月–2017年06月" }],
    workExperience: [
      { company: "豐澤電器", position: "倉務員", period: "2020年02月–2023年07月", description: "負責電器產品入倉、出貨及庫存核對，維護倉庫整潔。" },
      { company: "百老匯電器", position: "兼職倉務", period: "2017年07月–2020年01月", description: "協助節日促銷期間大量貨物處理工作。" },
    ],
    certificates: [
      { name: "貨物處理操作資格", remark: "香港物流協會頒授，2019年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-007",
    gender: "女", age: 24, languages: ["廣東話", "英語", "普通話", "日語"],
    summary: "熱愛餐飲服務業，具兩年侍應及接待經驗。溝通能力出色，能流利以多種語言服務客人，對食物有濃厚興趣。",
    education: [{ school: "香港旅遊學院", major: "酒店服務", level: "文憑", period: "2020年09月–2022年06月" }],
    workExperience: [
      { company: "海港城餐廳", position: "侍應生", period: "2022年08月–2024年11月", description: "提供優質桌面服務，熟悉Wine & Dine配搭知識，處理訂座及特別要求。" },
    ],
    certificates: [
      { name: "侍酒師初級資格", remark: "香港侍酒師協會頒授，2023年", imageUrl: CERT_PLACEHOLDER },
      { name: "食物處理衞生證書", remark: "食物環境衞生署頒授，2022年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-008",
    gender: "女", age: 27, languages: ["廣東話", "普通話", "英語"],
    summary: "具備三年中高級餐廳服務經驗，擅長安排宴會及VIP接待。工作態度積極，能在高壓環境保持專業。",
    education: [{ school: "香港理工大學", major: "酒店管理", level: "學士學位", period: "2017年09月–2021年06月" }],
    workExperience: [
      { company: "文華東方酒店", position: "餐廳侍應", period: "2021年09月–2024年08月", description: "負責高端餐廳日常服務，協助籌辦商務晚宴，管理客戶關係。" },
    ],
    certificates: [
      { name: "餐飲服務管理文憑", remark: "香港旅遊業議會頒授，2021年", imageUrl: CERT_PLACEHOLDER },
      { name: "急救員證書", remark: "香港聖約翰救傷會頒授，2022年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-009",
    gender: "男", age: 21, languages: ["廣東話", "英語"],
    summary: "在讀大學生，主修餐旅管理，希望積累實際工作經驗。性格開朗，服務熱誠，能配合彈性班次安排。",
    education: [{ school: "香港城市大學", major: "餐旅及旅遊管理", level: "學士學位（在讀）", period: "2024年09月–至今" }],
    workExperience: [
      { company: "大家樂", position: "兼職服務員", period: "2023年06月–2024年08月", description: "負責點餐、上菜及清潔工作，學習基本餐飲服務技能。" },
    ],
    certificates: [],
  },
  {
    applicantId: "APP-010",
    gender: "女", age: 23, languages: ["廣東話", "普通話", "英語"],
    summary: "具一年餐廳侍應經驗，待人處事有禮，學習能力強。對餐飲業有熱誠，期望在此行業長遠發展。",
    education: [{ school: "職業訓練局", major: "餐飲服務", level: "文憑", period: "2021年09月–2023年06月" }],
    workExperience: [
      { company: "翠華餐廳", position: "侍應生", period: "2023年07月–2024年06月", description: "負責桌面服務、落單及協助廚房配菜。" },
    ],
    certificates: [
      { name: "食物處理衞生證書", remark: "食物環境衞生署頒授，2023年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-011",
    gender: "男", age: 33, languages: ["廣東話", "英語", "普通話"],
    summary: "擁有八年餐飲業經驗，曾任職多間知名餐廳，熟悉宴會服務及酒水知識。管理能力強，曾帶領前線服務團隊。",
    education: [{ school: "香港旅遊學院", major: "餐飲及款待管理", level: "高級文憑", period: "2011年09月–2013年06月" }],
    workExperience: [
      { company: "嘉里酒店", position: "高級侍應生", period: "2018年03月–2025年04月", description: "負責VIP廳服務，培訓新入職侍應，協助制定服務標準。" },
      { company: "香港會", position: "侍應生", period: "2013年07月–2018年02月", description: "為會員提供私人俱樂部餐飲服務。" },
    ],
    certificates: [
      { name: "侍酒師中級資格 (WSET Level 2)", remark: "英國葡萄酒及烈酒教育基金頒授，2017年", imageUrl: CERT_PLACEHOLDER },
      { name: "餐飲服務管理文憑", remark: "香港旅遊業議會頒授，2014年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-012",
    gender: "女", age: 25, languages: ["廣東話", "普通話", "英語"],
    summary: "具兩年品牌推廣及活動策劃經驗，形象出眾，表達能力強。擅長現場演示及客戶互動，能有效達成銷售目標。",
    education: [{ school: "香港浸會大學", major: "傳播學", level: "學士學位", period: "2019年09月–2023年06月" }],
    workExperience: [
      { company: "歐萊雅香港", position: "品牌推廣專員", period: "2023年08月–2025年03月", description: "負責美妝產品現場推廣，策劃試用活動，完成月度銷售指標。" },
    ],
    certificates: [
      { name: "數碼市場推廣文憑", remark: "香港管理專業協會頒授，2023年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-013",
    gender: "男", age: 30, languages: ["廣東話", "英語", "普通話"],
    summary: "擁有四年銷售推廣經驗，善於分析客戶需求，業績表現突出。具備豐富的品牌活動策劃經驗，人際關係良好。",
    education: [{ school: "香港中文大學", major: "市場學", level: "學士學位", period: "2014年09月–2018年06月" }],
    workExperience: [
      { company: "三星電子香港", position: "品牌推廣主任", period: "2020年01月–2025年02月", description: "負責零售渠道推廣活動，管理推廣員團隊，提升品牌知名度。" },
      { company: "蘋果電腦香港", position: "零售推廣員", period: "2018年07月–2019年12月", description: "為顧客提供產品演示及購買建議。" },
    ],
    certificates: [
      { name: "專業銷售員資格", remark: "香港零售管理協會頒授，2019年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-014",
    gender: "女", age: 27, languages: ["廣東話", "普通話", "英語", "韓語"],
    summary: "具備三年美妝及時尚品牌推廣經驗，熟悉KOL合作及社交媒體推廣策略。個人形象專業，具親和力。",
    education: [{ school: "香港理工大學", major: "時裝及紡織品設計", level: "學士學位", period: "2017年09月–2021年06月" }],
    workExperience: [
      { company: "資生堂香港", position: "美容顧問兼推廣員", period: "2021年08月–2025年01月", description: "提供美容諮詢服務，策劃季節性推廣活動，管理VIP客戶關係。" },
    ],
    certificates: [
      { name: "化粧師專業資格", remark: "香港化粧師公會頒授，2021年", imageUrl: CERT_PLACEHOLDER },
      { name: "色彩顧問資格", remark: "國際色彩協會認證，2022年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-015",
    gender: "男", age: 38, languages: ["廣東話", "普通話"],
    summary: "擁有十年市場推廣及銷售管理經驗，曾主導多個大型品牌活動。具備出色的團隊領導及項目管理能力。",
    education: [{ school: "香港大學", major: "工商管理", level: "碩士學位", period: "2009年09月–2011年07月" }],
    workExperience: [
      { company: "可口可樂香港", position: "市場推廣經理", period: "2016年04月–2025年03月", description: "統籌全港推廣活動預算及執行，管理十五人推廣團隊，與代理商協作。" },
      { company: "百事可樂香港", position: "推廣主任", period: "2011年08月–2016年03月", description: "負責零售及餐飲渠道推廣活動策劃與執行。" },
    ],
    certificates: [
      { name: "項目管理專業人員資格 (PMP)", remark: "美國項目管理學會認證，2015年考獲", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-016",
    gender: "女", age: 45, languages: ["廣東話"],
    summary: "具有五年清潔及設施管理工作經驗，工作認真細心，準時可靠。熟悉各類清潔設備及清潔劑的正確使用方法。",
    education: [{ school: "香港官立職業訓練局", major: "物業管理", level: "職業訓練證書", period: "2005年09月–2006年06月" }],
    workExperience: [
      { company: "初好清潔服務", position: "清潔主任", period: "2019年05月–2025年01月", description: "負責商業大廈日常清潔工作，管理清潔用品採購，帶領三人清潔團隊。" },
      { company: "新加坡航空香港", position: "機艙清潔員", period: "2010年03月–2019年04月", description: "負責航班抵達後的機艙清潔工作，確保符合航空安全標準。" },
    ],
    certificates: [
      { name: "物業管理資格", remark: "物業管理業監管局認可，2018年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-017",
    gender: "女", age: 29, languages: ["廣東話", "普通話", "英語"],
    summary: "具備四年客戶服務中心工作經驗，溝通技巧出色，善於處理複雜投訴。具備CRM系統操作經驗，能有效管理客戶關係。",
    education: [{ school: "香港城市大學", major: "資訊系統", level: "學士學位", period: "2015年09月–2019年06月" }],
    workExperience: [
      { company: "香港電訊", position: "客服代表", period: "2020年02月–2025年01月", description: "處理客戶電話及電郵查詢，解決賬單及技術問題，維持高客戶滿意度。" },
      { company: "渣打銀行", position: "客服專員", period: "2019年07月–2020年01月", description: "負責銀行業務電話查詢及投訴處理。" },
    ],
    certificates: [
      { name: "客戶服務管理文憑", remark: "香港管理專業協會頒授，2021年", imageUrl: CERT_PLACEHOLDER },
      { name: "電話技巧優質服務資格", remark: "效率促進辦事處頒授，2020年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-018",
    gender: "男", age: 26, languages: ["廣東話", "英語"],
    summary: "具一年客服經驗，溝通態度良好，耐心細緻。正在進修客戶管理課程，期望提升專業技能。",
    education: [{ school: "香港職業訓練局", major: "工商管理", level: "高級文憑", period: "2018年09月–2020年06月" }],
    workExperience: [
      { company: "HKT客戶服務中心", position: "客服助理", period: "2023年03月–2024年07月", description: "處理日常客戶查詢，協助解決服務問題，達到月度服務指標。" },
    ],
    certificates: [
      { name: "客戶服務基礎培訓證書", remark: "香港電訊業訓練委員會頒授，2023年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-019",
    gender: "女", age: 32, languages: ["廣東話", "普通話", "英語"],
    summary: "具備七年金融業客服及銷售支援經驗，熟悉保險及投資產品。溝通能力強，善於跨部門協調，具備一定管理潛力。",
    education: [{ school: "香港中文大學", major: "金融學", level: "學士學位", period: "2012年09月–2016年06月" }],
    workExperience: [
      { company: "友邦保險", position: "客服主任", period: "2019年04月–2025年02月", description: "負責保單查詢及理賠處理，管理VIP客戶關係，達成交叉銷售目標。" },
      { company: "滙豐銀行", position: "客服代表", period: "2016年07月–2019年03月", description: "提供個人銀行業務查詢服務，處理日常賬戶事宜。" },
    ],
    certificates: [
      { name: "保險業監管局牌照（一般保險及人壽）", remark: "保監局發出，2017年考獲", imageUrl: CERT_PLACEHOLDER },
      { name: "證券及期貨從業員資格", remark: "香港證監會認可，2018年考獲", imageUrl: CERT_PLACEHOLDER },
    ],
  },
  {
    applicantId: "APP-020",
    gender: "男", age: 26, languages: ["廣東話", "普通話"],
    summary: "具兩年銷售及推廣工作經驗，待人友善，積極主動。對推廣行業有熱誠，期望把握機會正式加入團隊。",
    education: [{ school: "香港專業教育學院", major: "工商管理", level: "副學士", period: "2018年09月–2020年06月" }],
    workExperience: [
      { company: "卓悅控股", position: "銷售員", period: "2022年03月–2024年10月", description: "負責店內產品銷售及顧客服務，達成月度銷售目標。" },
    ],
    certificates: [],
  },
  {
    applicantId: "APP-021",
    gender: "女", age: 22, languages: ["廣東話", "英語"],
    summary: "剛畢業，主修市場推廣，形象整潔，親和力強。擁有校內推廣活動策劃經驗，反應靈活，學習能力佳。",
    education: [{ school: "香港知專設計學院", major: "市場推廣及廣告", level: "文憑", period: "2021年09月–2024年06月" }],
    workExperience: [
      { company: "School Event Team", position: "推廣助理（義務）", period: "2023年03月–2023年12月", description: "協助策劃及執行校園品牌推廣活動，負責現場佈置及人流引導。" },
    ],
    certificates: [],
  },
  {
    applicantId: "APP-022",
    gender: "男", age: 29, languages: ["廣東話", "普通話", "英語"],
    summary: "具四年零售及推廣工作經驗，熟悉各類型促銷活動操作，溝通能力強，形象專業。曾參與多個大型品牌推廣項目。",
    education: [{ school: "香港理工大學", major: "市場學", level: "高級文憑", period: "2015年09月–2017年06月" }],
    workExperience: [
      { company: "百老匯電器", position: "推廣員", period: "2020年05月–2025年03月", description: "負責門店產品推廣及展示，完成年度銷售指標，獲優秀員工獎。" },
    ],
    certificates: [
      { name: "專業銷售員資格", remark: "香港零售管理協會頒授，2021年", imageUrl: CERT_PLACEHOLDER },
    ],
  },
];

const RESUME_MAP = new Map(MOCK_RESUMES.map(r => [r.applicantId, r]));

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];
function avatarColor(id: string) {
  const idx = parseInt(id.replace("APP-", ""), 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const STATUS_COLORS: Record<AppStatus, string> = {
  "待審核": "bg-amber-50 text-amber-700 border-amber-200",
  "已錄用": "bg-green-50 text-green-700 border-green-200",
  "已拒絕": "bg-red-50 text-red-600 border-red-200",
  "候選池": "bg-violet-50 text-violet-700 border-violet-200",
  "已撤回": "bg-orange-50 text-orange-700 border-orange-200",
};

type StatusFilter = "all" | AppStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all",   label: "全部" },
  { key: "待審核", label: "待審核" },
  { key: "已錄用", label: "已錄用" },
  { key: "已拒絕", label: "已拒絕" },
  { key: "候選池", label: "候選池" },
  { key: "已撤回", label: "已撤回" },
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
          value !== "all"
            ? "border-blue-400 text-blue-700 bg-blue-50"
            : "border-slate-200 text-slate-600"
        }`}
      >
        <option value="all">{label}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 w-4 h-4 text-slate-400" />
    </div>
  );
}

// ── Resume Modal ───────────────────────────────────────────
// HK education level badge colors
const LEVEL_COLORS: Record<string, string> = {
  "中學": "bg-slate-100 text-slate-600 border-slate-200",
  "文憑": "bg-sky-50 text-sky-700 border-sky-200",
  "職業訓練證書": "bg-slate-100 text-slate-600 border-slate-200",
  "副學士": "bg-violet-50 text-violet-700 border-violet-200",
  "高級文憑": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "學士學位": "bg-blue-50 text-blue-700 border-blue-200",
  "學士學位（在讀）": "bg-blue-50 text-blue-600 border-blue-200",
  "碩士學位": "bg-purple-50 text-purple-700 border-purple-200",
  "博士學位": "bg-pink-50 text-pink-700 border-pink-200",
};
function levelBadgeClass(level: string) {
  for (const key of Object.keys(LEVEL_COLORS)) {
    if (level.includes(key)) return LEVEL_COLORS[key];
  }
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function ResumeModal({
  applicant,
  onClose,
  onReview,
}: {
  applicant: Applicant;
  onClose: () => void;
  onReview?: () => void;
}) {
  const resume = RESUME_MAP.get(applicant.id);
  const [certImageUrl, setCertImageUrl] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 pr-14 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold text-slate-900">候選人在線簡歷</DialogTitle>
            {applicant.appType === "pool" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-medium">
                <Hourglass className="w-3 h-3" />候選池
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {applicant.jobTitle} · {applicant.store}
            {applicant.appType === "pool" && " · 已招滿職位的後備候選人"}
          </DialogDescription>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Identity card */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 ${avatarColor(applicant.id)}`}>
                {applicant.name[0]}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-semibold text-slate-900">{applicant.name}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLORS[applicant.appStatus]}`}>
                    {applicant.appStatus}
                  </span>
                </div>
                {resume && (
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-sm text-slate-600">{resume.gender}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-sm text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />{applicant.phone}
                    </span>
                  </div>
                )}
                {resume && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {resume.languages.map(lang => (
                      <span key={lang} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{lang}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {resume ? (
            <div className="px-6 py-5 space-y-6">
              {/* Summary */}
              <section>
                <SectionTitle icon={<Star className="w-4 h-4" />} title="個人優勢介紹" />
                <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3">
                  {resume.summary}
                </p>
              </section>

              {/* Education */}
              <section>
                <SectionTitle icon={<GraduationCap className="w-4 h-4" />} title="教育背景" />
                <div className="space-y-3">
                  {resume.education.map((edu, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-medium text-slate-900">{edu.school}</span>
                            <span className="text-sm text-slate-500 ml-1.5">{edu.major}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 tabular-nums">{edu.period}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${levelBadgeClass(edu.level)}`}>
                            {edu.level}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Work experience */}
              <section>
                <SectionTitle icon={<BriefcaseIcon className="w-4 h-4" />} title="工作經歷" />
                <div className="space-y-3">
                  {resume.workExperience.map((exp, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{exp.position}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{exp.company}</div>
                        </div>
                        <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">{exp.period}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Certificates */}
              <section>
                <SectionTitle icon={<Award className="w-4 h-4" />} title="技能證書" />
                {resume.certificates.length > 0 ? (
                  <div className="space-y-2">
                    {resume.certificates.map((cert, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 border border-slate-100 rounded-xl bg-white">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{cert.name}</div>
                          {cert.remark && (
                            <div className="text-xs text-slate-500 mt-0.5">備注：{cert.remark}</div>
                          )}
                        </div>
                        {cert.imageUrl && (
                          <button
                            onClick={() => setCertImageUrl(cert.imageUrl!)}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="w-3 h-3" />查看圖片
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">暫無相關證書</p>
                )}
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm">暫無在線簡歷資料</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>申請時間：{applicant.appliedAt}</span>
            <span className="ml-2 text-slate-300">{applicant.id}</span>
          </div>
          {applicant.appStatus === "待審核" && onReview && (
            <button
              onClick={onReview}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />去審核
            </button>
          )}
          {applicant.appType === "pool" && applicant.appStatus === "候選池" && onReview && (
            <button
              onClick={onReview}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors shrink-0"
            >
              <UserCheck className="w-4 h-4" />直接錄用
            </button>
          )}
        </div>
      </DialogContent>

      {/* Certificate image lightbox */}
      {certImageUrl && (
        <Dialog open onOpenChange={() => setCertImageUrl(null)}>
          <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <DialogTitle className="text-sm font-semibold text-slate-900">證書圖片</DialogTitle>
              <DialogDescription className="sr-only">候選人證書圖片預覽</DialogDescription>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center min-h-[300px]">
              <img
                src={certImageUrl}
                alt="證書圖片"
                className="max-w-full max-h-[520px] rounded-lg shadow-md object-contain"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setCertImageUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                關閉
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-blue-600">{icon}</span>
      <span className="text-sm font-semibold text-slate-800">{title}</span>
      <div className="flex-1 h-px bg-slate-100 ml-1" />
    </div>
  );
}

// ── Review Modal ───────────────────────────────────────────
function ReviewModal({
  applicant,
  onClose,
  onApprove,
  onReject,
  onViewResume,
  onViewWorkHistory,
}: {
  applicant: Applicant;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onViewResume: () => void;
  onViewWorkHistory: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [step, setStep] = useState<"main" | "reject-confirm">("main");

  const history = CANDIDATE_HISTORY_MAP.get(applicant.id);
  const stats   = history ? getHistoryStats(history.entries) : null;
  const hasHistory = !!history;

  const handleReject = () => {
    onReject(applicant.id, rejectReason);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {applicant.appType === "pool" ? "候選池 — 快速錄用" : "審核申請"}
            </DialogTitle>
            {applicant.appType === "pool" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-medium">
                <Hourglass className="w-3 h-3" />候選池
              </span>
            )}
          </div>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">
            {applicant.jobTitle} · {applicant.store}
            {applicant.appType === "pool" && " · 後備候選人，可直接錄用補位"}
          </DialogDescription>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Applicant info */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 ${avatarColor(applicant.id)}`}>
              {applicant.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900">{applicant.name}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{applicant.phone}</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 ${STATUS_COLORS[applicant.appStatus]}`}>
              {applicant.appStatus}
            </span>
          </div>

          {/* Work history summary */}
          {!hasHistory ? (
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <History className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-slate-700">本商戶工作記錄</div>
                <div className="text-xs text-slate-400 mt-0.5">首次申請，暫無過往互動記錄</div>
              </div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200 font-medium shrink-0">
                首次申請
              </span>
            </div>
          ) : (
            <button
              onClick={onViewWorkHistory}
              className="w-full flex items-center gap-3 px-3.5 py-3 border border-slate-200 bg-slate-50/80 rounded-xl hover:bg-slate-100 transition-colors group text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <History className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-800">本商戶工作記錄</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {stats!.appCount} 次申請記錄
                  {stats!.empCount > 0 && ` · ${stats!.empCount} 次在職記錄`}
                  {stats!.rejectCount > 0 && ` · 拒絕錄用 ${stats!.rejectCount} 次`}
                  {stats!.revokeCount > 0 && ` · 駁回錄用 ${stats!.revokeCount} 次`}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium shrink-0">
                查看詳情
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )}

          {/* View resume shortcut */}
          <button
            onClick={onViewResume}
            className="w-full flex items-center gap-3 px-3.5 py-3 border border-blue-200 bg-blue-50/60 rounded-xl hover:bg-blue-50 transition-colors group"
          >
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm text-blue-700 font-medium flex-1 text-left">查看候選人在線簡歷</span>
            <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Job info */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">申請職位</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{applicant.jobTitle}</span>
              <span className="text-slate-500 text-xs">{applicant.jobId} · {applicant.store}</span>
            </div>
          </div>

          {step === "reject-confirm" && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500">駁回原因（選填）</div>
              <textarea
                rows={3}
                placeholder="說明駁回原因，有助求職者改善…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          {applicant.appType === "pool" ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { onApprove(applicant.id); onClose(); }}
              >
                <UserCheck className="w-4 h-4 mr-1.5" />直接錄用
              </Button>
            </>
          ) : step === "main" ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setStep("reject-confirm")}
              >
                <XCircle className="w-4 h-4 mr-1.5" />駁回
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { onApprove(applicant.id); onClose(); }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />錄用
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setStep("main")}>返回</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
              >
                確認駁回
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Manage Hired Modal ─────────────────────────────────────
const REVOKE_REASONS = [
  { value: "position_change", label: "商户原因" },
  { value: "candidate_change", label: "人才原因" },
];

function ManageHiredModal({
  applicant,
  onClose,
  onRevoke,
}: {
  applicant: Applicant;
  onClose: () => void;
  onRevoke: (id: string, reason: string, detail: string) => void;
}) {
  const [step, setStep] = useState<"main" | "revoke">("main");
  const [revokeReason, setRevokeReason] = useState(REVOKE_REASONS[0].value);
  const [revokeDetail, setRevokeDetail] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">管理錄用</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">
            {applicant.jobTitle} · {applicant.store}
          </DialogDescription>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Applicant info */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 ${avatarColor(applicant.id)}`}>
              {applicant.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900">{applicant.name}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{applicant.phone}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 bg-green-50 text-green-700 border-green-200">
              已錄用
            </span>
          </div>

          {step === "revoke" && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">駁回原因</div>
              <div className="space-y-2">
                {REVOKE_REASONS.map(r => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      revokeReason === r.value
                        ? "border-red-400 bg-red-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="revokeReason"
                      value={r.value}
                      checked={revokeReason === r.value}
                      onChange={() => setRevokeReason(r.value)}
                      className="accent-red-600"
                    />
                    <span className={`text-sm font-medium ${revokeReason === r.value ? "text-red-700" : "text-slate-700"}`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-slate-500">駁回說明（必填）</div>
                <textarea
                  rows={3}
                  placeholder="請詳細說明駁回錄用的原因…"
                  value={revokeDetail}
                  onChange={e => setRevokeDetail(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          {step === "main" ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => setStep("revoke")}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />駁回錄用
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setStep("main")}>返回</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!revokeDetail.trim()}
                onClick={() => {
                  const reasonLabel = REVOKE_REASONS.find(r => r.value === revokeReason)?.label ?? revokeReason;
                  onRevoke(applicant.id, reasonLabel, revokeDetail);
                  onClose();
                }}
              >
                確認駁回錄用
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function TalentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unreadApplicantIds, markApplicantRead } = useNotifications();

  const [applicants, setApplicants] = useState<Applicant[]>(MOCK_APPLICANTS);
  const [activeTab, setActiveTab]   = useState<StatusFilter>("all");
  const [search, setSearch]         = useState("");
  const [storeFilter, setStoreFilter]       = useState(() => searchParams.get("store") ?? "all");
  const [genderFilter, setGenderFilter]     = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [jobFilter, setJobFilter]           = useState(() => searchParams.get("jobId") ?? "all");
  const [reviewTarget, setReviewTarget]   = useState<Applicant | null>(null);
  const [resumeTarget, setResumeTarget]   = useState<Applicant | null>(null);
  const [manageTarget, setManageTarget]   = useState<Applicant | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{id: string; name: string} | null>(null);
  const [revokeDetails, setRevokeDetails] = useState<Map<string, { reason: string; detail: string }>>(new Map());
  const [viewRevokeTarget, setViewRevokeTarget] = useState<Applicant | null>(null);

  const allStores = Array.from(new Set(MOCK_APPLICANTS.map(a => a.store))).sort();
  const allJobs   = Array.from(new Map(MOCK_APPLICANTS.map(a => [a.jobId, a.jobTitle])).entries());

  const getResume = (id: string) => MOCK_RESUMES.find(r => r.applicantId === id);

  const matchAge = (age: number) => {
    if (ageMin && age < Number(ageMin)) return false;
    if (ageMax && age > Number(ageMax)) return false;
    return true;
  };

  // Deep-link: open review panel for a specific applicant (e.g. from jobs-page "去審核")
  useEffect(() => {
    const targetId = searchParams.get("applicant");
    if (targetId) {
      const found = MOCK_APPLICANTS.find(a => a.id === targetId);
      if (found) setReviewTarget(found);
    }
  }, []);

  const filtered = applicants.filter(a => {
    const resume = getResume(a.id);
    const matchTab    = activeTab === "all" || a.appStatus === activeTab;
    const matchStore  = storeFilter === "all" || a.store === storeFilter;
    const matchJob    = jobFilter === "all" || a.jobId === jobFilter;
    const matchGender = genderFilter === "all" || resume?.gender === genderFilter;
    const matchEdu    = educationFilter === "all" || (resume?.education[0]?.level ?? "") === educationFilter;
    const matchAgeVal = matchAge(resume?.age ?? 0);
    const matchSearch = !search || a.name.includes(search) || a.phone.includes(search) || a.jobTitle.includes(search);
    return matchTab && matchStore && matchJob && matchGender && matchEdu && matchAgeVal && matchSearch;
  });

  const countByStatus = (s: StatusFilter) =>
    s === "all" ? applicants.length : applicants.filter(a => a.appStatus === s).length;

  const [actionToast, setActionToast] = useState<{ type: "approve" | "reject" | "pool-hire" | "revoke-hire"; name: string } | null>(null);

  const showToast = (type: "approve" | "reject" | "pool-hire" | "revoke-hire", name: string) => {
    setActionToast({ type, name });
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleApprove = (id: string) => {
    const a = applicants.find(ap => ap.id === id);
    const name = a?.name ?? "";
    setApplicants(prev => prev.map(ap => ap.id === id ? { ...ap, appStatus: "已錄用" } : ap));
    showToast(a?.appType === "pool" ? "pool-hire" : "approve", name);
  };
  const handleReject = (id: string, _reason: string) => {
    const name = applicants.find(a => a.id === id)?.name ?? "";
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, appStatus: "已拒絕" } : a));
    showToast("reject", name);
  };
  const handleRevokeHire = (id: string, reason: string, detail: string) => {
    const name = applicants.find(a => a.id === id)?.name ?? "";
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, appStatus: "已撤回" } : a));
    setRevokeDetails(prev => new Map(prev).set(id, { reason, detail }));
    showToast("revoke-hire", name);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">候选人管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理所有候选人的求職申請記錄</p>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        {/* Action toast */}
        {actionToast && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionToast.type === "reject" || actionToast.type === "revoke-hire"
              ? "bg-red-50 border-red-200 text-red-800"
              : actionToast.type === "pool-hire"
              ? "bg-violet-50 border-violet-200 text-violet-800"
              : "bg-green-50 border-green-200 text-green-800"
          }`}>
            {(actionToast.type === "reject" || actionToast.type === "revoke-hire")
              ? <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              : actionToast.type === "pool-hire"
              ? <UserCheck className="w-4 h-4 text-violet-500 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            }
            <span>
              <span className="font-semibold">{actionToast.name}</span>
              {actionToast.type === "approve" ? " 已成功錄用"
                : actionToast.type === "pool-hire" ? " 已從候選池錄用補位"
                : actionToast.type === "revoke-hire" ? " 錄用已被駁回"
                : " 已被駁回"}
            </span>
          </div>
        )}

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-full">

            {/* Filters bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3 shadow-sm">
              {/* Row 1: search + store + job */}
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
                {/* Store */}
                <FilterSelect value={storeFilter} onChange={setStoreFilter} label="全部網點">
                  {allStores.map(s => <option key={s} value={s}>{s}</option>)}
                </FilterSelect>
                {/* Job */}
                <FilterSelect value={jobFilter} onChange={setJobFilter} label="全部職位">
                  {allJobs.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
                </FilterSelect>
              </div>
              {/* Row 2: gender + education + age */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" />候選人
                </span>
                {/* Gender */}
                <FilterSelect value={genderFilter} onChange={setGenderFilter} label="性別不限">
                  <option value="男">男</option>
                  <option value="女">女</option>
                </FilterSelect>
                {/* Education */}
                <FilterSelect value={educationFilter} onChange={setEducationFilter} label="學歷不限">
                  <option value="中學">中學</option>
                  <option value="文憑">文憑</option>
                  <option value="職業訓練證書">職業訓練證書</option>
                  <option value="副學士">副學士</option>
                  <option value="高級文憑">高級文憑</option>
                  <option value="學士">學士</option>
                  <option value="碩士">碩士</option>
                </FilterSelect>
                {/* Age range */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 shrink-0">年齡</span>
                  <input
                    type="number"
                    min={16}
                    max={99}
                    placeholder="最小"
                    value={ageMin}
                    onChange={e => setAgeMin(e.target.value)}
                    className="w-16 h-8 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-xs text-slate-400">–</span>
                  <input
                    type="number"
                    min={16}
                    max={99}
                    placeholder="最大"
                    value={ageMax}
                    onChange={e => setAgeMax(e.target.value)}
                    className="w-16 h-8 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-xs text-slate-400 shrink-0">歲</span>
                </div>
                {/* Clear all */}
                {(genderFilter !== "all" || educationFilter !== "all" || ageMin !== "" || ageMax !== "" || storeFilter !== "all" || jobFilter !== "all") && (
                  <button
                    onClick={() => { setGenderFilter("all"); setEducationFilter("all"); setAgeMin(""); setAgeMax(""); setStoreFilter("all"); setJobFilter("all"); }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1"
                  >
                    清除篩選
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
                <table className="w-full table-fixed min-w-[1020px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-[120px]">申請者</th>
                      <th className="px-4 py-3 text-left w-[130px]">聯絡電話</th>
                      <th className="px-4 py-3 text-center w-[60px]">性別</th>
                      <th className="px-4 py-3 text-center w-[60px]">年齡</th>
                      <th className="px-4 py-3 text-left w-[110px]">申請職位</th>
                      <th className="px-4 py-3 text-left w-[110px]">工作网点</th>
                      <th className="px-4 py-3 text-left w-[100px]">申請時間</th>
                      <th className="px-4 py-3 text-left w-[90px]">狀態</th>
                      <th className="px-4 py-3 text-center w-[90px]">歷史記錄</th>
                      <th className="px-4 py-3 text-left w-[160px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Users className="w-8 h-8 text-slate-300" />
                            <span className="text-sm">暫無符合條件的申請記錄</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map(a => {
                      const isUnread = unreadApplicantIds.has(a.id);
                      const resume = getResume(a.id);
                      return (
                      <tr key={a.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors ${isUnread ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${a.appType === "pool" ? "bg-violet-100 text-violet-700" : avatarColor(a.id)}`}>
                                {a.name[0]}
                              </div>
                              {isUnread && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-medium ${isUnread ? "text-slate-900" : "text-slate-700"}`}>{a.name}</span>
                                {isUnread && (
                                  <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full leading-none">新</span>
                                )}
                                {a.appType === "pool" && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-violet-100 text-violet-600 font-semibold px-1.5 py-0.5 rounded-full leading-none border border-violet-200">
                                    <Hourglass className="w-2.5 h-2.5" />候選池
                                  </span>
                                )}
                              </div>
                              {/* Work history indicator */}
                              {(() => {
                                const hist = CANDIDATE_HISTORY_MAP.get(a.id);
                                if (!hist) {
                                  return (
                                    <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                                      <History className="w-2.5 h-2.5" />首次申請
                                    </span>
                                  );
                                }
                                const s = getHistoryStats(hist.entries);
                                return (
                                  <button
                                    onClick={e => { e.stopPropagation(); navigate(`/work-records?candidate=${a.id}&from=review`); }}
                                    className="text-[10px] text-blue-600 hover:text-blue-700 mt-0.5 flex items-center gap-0.5 transition-colors"
                                  >
                                    <History className="w-2.5 h-2.5" />
                                    {s.appCount}次記錄{s.hasRiskFlag ? " ⚠" : ""}
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums">{a.phone}</td>
                        <td className="px-4 py-3.5 text-center">
                          {resume ? (
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${
                              resume.gender === "女"
                                ? "bg-pink-50 text-pink-600 border-pink-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}>{resume.gender}</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {resume
                            ? <span className="text-sm text-slate-700">{resume.age}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-900">{a.jobTitle}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{a.jobId}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{a.store}</td>
                        <td className="px-4 py-3.5 text-slate-500 tabular-nums">{a.appliedAt}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLORS[a.appStatus]}`}>
                            {a.appStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {(() => {
                            const hist = CANDIDATE_HISTORY_MAP.get(a.id);
                            if (!hist) return <span className="text-xs text-slate-400">首次申請</span>;
                            const s = getHistoryStats(hist.entries);
                            return (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs text-slate-700 font-medium">{s.appCount + s.empCount} 次</span>
                                <button onClick={() => setHistoryTarget({id: a.id, name: a.name})}
                                  className="text-[10px] text-blue-600 hover:underline">查看詳情</button>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => { setResumeTarget(a); markApplicantRead(a.id); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            >
                              <FileText className="w-3 h-3" />查看簡歷
                            </button>
                            {a.appStatus === "待審核" && (
                              <button
                                onClick={() => { setReviewTarget(a); markApplicantRead(a.id); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                              >
                                <ClipboardCheck className="w-3 h-3" />去審核
                              </button>
                            )}
                            {a.appStatus === "已錄用" && (
                              <button
                                onClick={() => { setManageTarget(a); markApplicantRead(a.id); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 bg-slate-50 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
                              >
                                <Settings className="w-3 h-3" />去管理
                              </button>
                            )}
                            {a.appStatus === "已撤回" && revokeDetails.has(a.id) && (
                              <button
                                onClick={() => setViewRevokeTarget(a)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100 transition-colors"
                              >
                                <FileText className="w-3 h-3" />查看原因
                              </button>
                            )}
                            {a.appType === "pool" && a.appStatus === "候選池" && (
                              <button
                                onClick={() => { setReviewTarget(a); markApplicantRead(a.id); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-violet-300 bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors"
                              >
                                <UserCheck className="w-3 h-3" />快速補位
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );})}
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

      {/* Resume Drawer */}
      {resumeTarget && (
        <ResumeModal
          applicant={resumeTarget}
          onClose={() => setResumeTarget(null)}
          onReview={(resumeTarget.appStatus === "待審核" || resumeTarget.appType === "pool") ? () => {
            setReviewTarget(resumeTarget);
            setResumeTarget(null);
          } : undefined}
        />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          applicant={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewResume={() => {
            setResumeTarget(reviewTarget);
            setReviewTarget(null);
          }}
          onViewWorkHistory={() => {
            navigate(`/work-records?candidate=${reviewTarget.id}&from=review`);
          }}
        />
      )}

      {/* Manage Hired Modal */}
      {manageTarget && (
        <ManageHiredModal
          applicant={manageTarget}
          onClose={() => setManageTarget(null)}
          onRevoke={handleRevokeHire}
        />
      )}

      {/* View Revoke Reason Dialog */}
      {viewRevokeTarget && (() => {
        const info = revokeDetails.get(viewRevokeTarget.id);
        return (
          <Dialog open onOpenChange={() => setViewRevokeTarget(null)}>
            <DialogContent className="max-w-sm p-0 gap-0 flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200">
                <DialogTitle className="text-base font-semibold text-slate-900">驳回錄用原因</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  {viewRevokeTarget.jobTitle} · {viewRevokeTarget.store}
                </DialogDescription>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 ${avatarColor(viewRevokeTarget.id)}`}>
                    {viewRevokeTarget.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm">{viewRevokeTarget.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />{viewRevokeTarget.phone}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full border text-xs font-medium bg-orange-50 text-orange-700 border-orange-200 shrink-0">
                    已撤回
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">驳回類型</div>
                    <div className="text-sm text-slate-900 font-medium">{info?.reason}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">驳回說明</div>
                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                      {info?.detail}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200">
                <Button variant="outline" className="w-full" onClick={() => setViewRevokeTarget(null)}>關閉</Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* History panel */}
      {historyTarget && (
        <HistoryPanel
          candidateId={historyTarget.id}
          displayName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
