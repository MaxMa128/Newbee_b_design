import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Briefcase, Plus, CheckCircle2, Clock, AlertCircle,
  ChevronRight, Settings, LogOut, Bell, Building2,
  Upload, FileText, AlertTriangle, ImageIcon, XCircle, RefreshCw,
  ShieldCheck, Send, ChevronDown, Eye, EyeOff, Globe,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { DebugPanel } from "../components/DebugPanel";
import { ContactSupportModal } from "../components/ContactSupportModal";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications } from "../contexts/notification-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";


const EMPLOYEE_OPTIONS = [
  { value: "1-20",    label: "1–20 人" },
  { value: "21-50",   label: "21–50 人" },
  { value: "51-100",  label: "51–100 人" },
  { value: "100-500", label: "100–500 人" },
  { value: "500+",    label: "500 人以上" },
];

const INDUSTRY_OPTIONS = [
  { value: "manufacturing", label: "製造業" },
  { value: "it",            label: "IT / 互聯網" },
  { value: "fnb",           label: "餐飲 / 酒店" },
  { value: "construction",  label: "建築業" },
  { value: "domestic",      label: "家政 / 物業" },
  { value: "other",         label: "其他" },
];

const COUNTRY_CODES = [
  { code: "+852", flag: "🇭🇰", name: "HK" },
  { code: "+86",  flag: "🇨🇳", name: "CN" },
  { code: "+886", flag: "🇹🇼", name: "TW" },
  { code: "+65",  flag: "🇸🇬", name: "SG" },
  { code: "+1",   flag: "🇺🇸", name: "US" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
];

const LANG_OPTIONS = [
  { value: "zh-HK", label: "繁體中文（香港）" },
  { value: "zh-CN", label: "简体中文" },
  { value: "en",    label: "English" },
];

function validateHKPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // Accept bare 8-digit HK number or with leading 852 country code
  return digits.length === 8 || (digits.length === 11 && digits.startsWith("852"));
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Section header used inside the form
function SectionTitle({ index, title, desc }: { index: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
        {index}
      </div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

// ── File upload area (logo or document)
function UploadArea({
  label, hint, accept, square = false, file, onChange,
}: {
  label: string; hint: string; accept: string;
  square?: boolean; file: File | null;
  onChange: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const previewUrl = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

  return (
    <div
      onClick={() => ref.current?.click()}
      className={`border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${
        square ? "w-28 h-28" : "w-full py-8"
      } ${file ? "border-blue-300 bg-blue-50/50" : ""}`}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="preview" className="w-full h-full object-cover rounded-xl" />
      ) : file ? (
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <FileText className="w-8 h-8 text-blue-500" />
          <span className="text-xs text-blue-700 font-medium break-all">{file.name}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          {square ? (
            <ImageIcon className="w-7 h-7 text-slate-400" />
          ) : (
            <Upload className="w-7 h-7 text-slate-400" />
          )}
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <span className="text-xs text-slate-400">{hint}</span>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { unreadTalentCount, unreadCount, verificationStatus, setVerificationStatus } = useNotifications();

  // Sync verification status from location state (e.g. returning from /merchant-profile)
  useEffect(() => {
    if ((location.state as { verificationSubmitted?: boolean } | null)?.verificationSubmitted) {
      setVerificationStatus("pending");
    }
  }, []);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [viewOnly, setViewOnly]           = useState(false);
  const [showCreateJobAlert, setShowCreateJobAlert] = useState(false);
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Verification form fields
  const [companyName, setCompanyName]         = useState("");
  const [companyIntro, setCompanyIntro]       = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [industryOther, setIndustryOther]     = useState("");
  const [brLegalName, setBrLegalName]         = useState("");
  const [employeeCount, setEmployeeCount]     = useState("");
  const [contactName, setContactName]         = useState("");
  const [contactEmail, setContactEmail]       = useState("");
  const [contactEmailError, setContactEmailError] = useState("");
  const [contactTitle, setContactTitle]       = useState("");
  const [contactPhone, setContactPhone]       = useState("");
  const [contactPhoneCode, setContactPhoneCode] = useState("+852");
  const [contactPhoneError, setContactPhoneError] = useState("");
  const [address, setAddress]                 = useState("");

  // OTP verification state
  const MOCK_OTP = "123456";
  const [emailOtpSent, setEmailOtpSent]       = useState(false);
  const [emailOtp, setEmailOtp]               = useState("");
  const [emailVerified, setEmailVerified]     = useState(false);
  const [emailOtpError, setEmailOtpError]     = useState("");
  const [emailCooldown, setEmailCooldown]     = useState(0);

  const [phoneOtpSent, setPhoneOtpSent]       = useState(false);
  const [phoneOtp, setPhoneOtp]               = useState("");
  const [phoneVerified, setPhoneVerified]     = useState(false);
  const [phoneOtpError, setPhoneOtpError]     = useState("");
  const [phoneCooldown, setPhoneCooldown]     = useState(0);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = setTimeout(() => setEmailCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [emailCooldown]);

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const t = setTimeout(() => setPhoneCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneCooldown]);

  const handleSendEmailOtp = () => {
    if (!validateEmail(contactEmail)) { setContactEmailError("請先輸入有效的電郵地址"); return; }
    setContactEmailError("");
    setEmailOtpSent(true);
    setEmailOtp("");
    setEmailOtpError("");
    setEmailCooldown(60);
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtp === MOCK_OTP) { setEmailVerified(true); setEmailOtpError(""); }
    else { setEmailOtpError("驗證碼錯誤，請重新輸入"); }
  };

  const handleSendPhoneOtp = () => {
    const digits = contactPhone.replace(/\D/g, "");
    const isHK = contactPhoneCode === "+852";
    if (isHK && !validateHKPhone(contactPhone)) { setContactPhoneError("請先輸入有效的香港電話號碼（8 位數字）"); return; }
    if (!isHK && digits.length < 6) { setContactPhoneError("請輸入有效的電話號碼"); return; }
    setContactPhoneError("");
    setPhoneOtpSent(true);
    setPhoneOtp("");
    setPhoneOtpError("");
    setPhoneCooldown(60);
  };

  const handleVerifyPhoneOtp = () => {
    if (phoneOtp === MOCK_OTP) { setPhoneVerified(true); setPhoneOtpError(""); }
    else { setPhoneOtpError("驗證碼錯誤，請重新輸入"); }
  };
  const [logoFile, setLogoFile]               = useState<File | null>(null);
  const [brFile, setBrFile]                   = useState<File | null>(null);

  // Credit data (stateful for debug simulation)
  const [creditLimit, setCreditLimit]   = useState(100000);
  const [usedCredit, setUsedCredit]     = useState(35000);
  const remainingCredit                 = creditLimit - usedCredit;
  const creditUsagePercent              = Math.min((usedCredit / creditLimit) * 100, 100);

  // Account settings dialog
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  // Language modal
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [uiLang, setUiLang] = useState("zh-HK");

  // Security — which panel is expanded
  const [securityPanel, setSecurityPanel] = useState<"email" | "phone" | "password" | null>(null);

  // Mock current account info
  const MOCK_EMAIL = "admin@hongtu.com";
  const MOCK_PHONE = "+852 9876 5432";
  const MOCK_PHONE_MASKED = "+852 ****5432";
  const MOCK_EMAIL_MASKED = "adm***@hongtu.com";

  // ── Change Email flow ──
  const [newEmail, setNewEmail]                         = useState("");
  const [newEmailError, setNewEmailError]               = useState("");
  const [emailVerifyMethod, setEmailVerifyMethod]       = useState<"email" | "phone">("email");
  const [ceOtp, setCeOtp]                               = useState("");
  const [ceOtpSent, setCeOtpSent]                       = useState(false);
  const [ceOtpError, setCeOtpError]                     = useState("");
  const [ceCooldown, setCeCooldown]                     = useState(0);
  const [emailChangeSuccess, setEmailChangeSuccess]     = useState(false);

  // ── Change Phone flow ──
  const [newPhone, setNewPhone]                         = useState("");
  const [newPhoneCode, setNewPhoneCode]                 = useState("+852");
  const [newPhoneError, setNewPhoneError]               = useState("");
  const [phoneVerifyMethod, setPhoneVerifyMethod]       = useState<"phone" | "email">("phone");
  const [cpOtp, setCpOtp]                               = useState("");
  const [cpOtpSent, setCpOtpSent]                       = useState(false);
  const [cpOtpError, setCpOtpError]                     = useState("");
  const [cpCooldown, setCpCooldown]                     = useState(0);
  const [phoneChangeSuccess, setPhoneChangeSuccess]     = useState(false);

  // ── Change Password flow ──
  const [pwdMethod, setPwdMethod]                       = useState<"password" | "phone">("password");
  const [currentPwd, setCurrentPwd]                     = useState("");
  const [newPwd, setNewPwd]                             = useState("");
  const [confirmPwd, setConfirmPwd]                     = useState("");
  const [showCurrentPwd, setShowCurrentPwd]             = useState(false);
  const [showNewPwd, setShowNewPwd]                     = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]             = useState(false);
  const [pwdSuccess, setPwdSuccess]                     = useState(false);
  const [pwdError, setPwdError]                         = useState("");
  const [ppOtp, setPpOtp]                               = useState("");
  const [ppOtpSent, setPpOtpSent]                       = useState(false);
  const [ppOtpError, setPpOtpError]                     = useState("");
  const [ppCooldown, setPpCooldown]                     = useState(0);

  useEffect(() => { if (ceCooldown <= 0) return; const t = setTimeout(() => setCeCooldown(c => c - 1), 1000); return () => clearTimeout(t); }, [ceCooldown]);
  useEffect(() => { if (cpCooldown <= 0) return; const t = setTimeout(() => setCpCooldown(c => c - 1), 1000); return () => clearTimeout(t); }, [cpCooldown]);
  useEffect(() => { if (ppCooldown <= 0) return; const t = setTimeout(() => setPpCooldown(c => c - 1), 1000); return () => clearTimeout(t); }, [ppCooldown]);

  const MOCK_OTP2 = "123456";

  const handleSendCeOtp = () => { setCeOtpSent(true); setCeOtp(""); setCeOtpError(""); setCeCooldown(60); };
  const handleVerifyCeOtp = () => {
    if (ceOtp === MOCK_OTP2) {
      if (!validateEmail(newEmail)) { setNewEmailError("請輸入有效的電子郵件地址"); return; }
      setEmailChangeSuccess(true); setCeOtp(""); setCeOtpSent(false);
    } else { setCeOtpError("驗證碼錯誤，請重新輸入"); }
  };

  const handleSendCpOtp = () => { setCpOtpSent(true); setCpOtp(""); setCpOtpError(""); setCpCooldown(60); };
  const handleVerifyCpOtp = () => {
    if (cpOtp === MOCK_OTP2) {
      if (!newPhone.trim()) { setNewPhoneError("請輸入新手機號碼"); return; }
      setPhoneChangeSuccess(true); setCpOtp(""); setCpOtpSent(false);
    } else { setCpOtpError("驗證碼錯誤，請重新輸入"); }
  };

  const handleSendPpOtp = () => { setPpOtpSent(true); setPpOtp(""); setPpOtpError(""); setPpCooldown(60); };
  const handleChangePwdByPhone = () => {
    if (ppOtp !== MOCK_OTP2) { setPpOtpError("驗證碼錯誤，請重新輸入"); return; }
    if (newPwd.length < 8) { setPwdError("新密碼不少於 8 位"); return; }
    if (newPwd !== confirmPwd) { setPwdError("兩次輸入的新密碼不一致"); return; }
    setPwdError(""); setPwdSuccess(true);
    setNewPwd(""); setConfirmPwd(""); setPpOtp(""); setPpOtpSent(false);
    setTimeout(() => setPwdSuccess(false), 3000);
  };

  const handleChangePwd = () => {
    if (!currentPwd) { setPwdError("請輸入目前密碼"); return; }
    if (newPwd.length < 8) { setPwdError("新密碼不少於 8 位"); return; }
    if (newPwd !== confirmPwd) { setPwdError("兩次輸入的新密碼不一致"); return; }
    setPwdError("");
    setPwdSuccess(true);
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setTimeout(() => setPwdSuccess(false), 3000);
  };

  const handleOpenVerification = () => {
    navigate("/merchant-profile");
  };

  const handleViewSubmittedData = () => {
    navigate("/merchant-profile", { state: { viewOnly: true } });
  };

  const handleCreateJob = () => {
    if (verificationStatus === "pending") {
      setShowPendingAlert(true);
    } else if (verificationStatus !== "verified") {
      setShowCreateJobAlert(true);
    } else if (creditUsagePercent >= 100) {
      setShowCreditAlert(true);
    } else {
      navigate("/create-job");
    }
  };

  const handleSubmitVerification = () => {
    let hasError = false;
    if (contactEmail && !emailVerified) {
      setContactEmailError("請先完成電郵驗證");
      hasError = true;
    }
    if (contactPhone && !phoneVerified) {
      setContactPhoneError("請先完成電話驗證");
      hasError = true;
    }
    if (hasError) return;
    setFormSubmitted(true);
  };

  const handleCloseAfterSubmit = () => {
    setVerificationStatus("pending");
    setShowVerificationForm(false);
    setFormSubmitted(false);
  };

  const sidebarVerificationBadge = () => {
    if (verificationStatus === "unverified") return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-600 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs text-amber-800 font-semibold">未認證</span>
          </div>
          <button onClick={handleOpenVerification} className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            去認證 →
          </button>
        </div>
      </div>
    );
    if (verificationStatus === "pending") return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-600 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs text-amber-800 font-semibold">審核中</span>
          </div>
          <span className="text-xs text-slate-500">1–2 工作天</span>
        </div>
      </div>
    );
    if (verificationStatus === "rejected") return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-600 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs text-red-700 font-semibold">審核失敗</span>
          </div>
          <button onClick={handleOpenVerification} className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            重新提交 →
          </button>
        </div>
      </div>
    );
    return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-600 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-green-700 font-semibold">已認證</span>
          </div>
          <button onClick={handleOpenVerification} className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            更新認證
          </button>
        </div>
      </div>
    );
  };

  const dashboardVerificationCard = () => {
    if (verificationStatus === "verified") return (
      <>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-medium text-slate-900">已認證</div>
            <div className="text-sm text-slate-500">商戶帳戶已完成企業認證</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          ✓ 已通過企業認證，可使用完整平台功能
        </div>
      </>
    );
    if (verificationStatus === "pending") return (
      <>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <div className="font-medium text-slate-900">審核中</div>
            <div className="text-sm text-slate-500">我們正在審核您的認證資料</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          預計審核時間：1–2 個工作天
        </div>
      </>
    );
    if (verificationStatus === "rejected") return (
      <>
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <div>
            <div className="font-medium text-slate-900">商業登記證審核失敗</div>
            <div className="text-sm text-slate-500">您提交的資料未能通過審核</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-1.5">
          <div className="text-sm font-medium text-red-800">駁回原因</div>
          <div className="text-sm text-red-700 leading-relaxed">
            {rejectionReason || "上傳的商業登記證文件模糊或資料不完整，請重新上傳清晰的原件掃描版本。"}
          </div>
        </div>
        <Button
          onClick={handleOpenVerification}
          variant="outline"
          className="mt-4 w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重新提交認證
        </Button>
      </>
    );
    return (
      <>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <div className="font-medium text-slate-900">未認證</div>
            <div className="text-sm text-slate-500">完成認證後可發佈職位及使用全部功能</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          職位發佈、申請管理等功能需要完成商戶認證後方可使用。
        </div>
        <Button
          onClick={handleOpenVerification}
          variant="outline"
          className="mt-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          立即認證
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      <Sidebar showSupportCard onContactSupport={() => setShowSupportModal(true)} />

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">工作台</h1>
              <p className="text-sm text-slate-500 mt-0.5">歡迎回來，管理您的招聘職位</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />

              {/* ── Verification Badge ── */}
              {verificationStatus === "unverified" && (
                <button
                  onClick={handleOpenVerification}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-semibold whitespace-nowrap leading-tight">商戶資料認證</div>
                    <div className="text-xs text-amber-600 leading-tight">未認證 — 點擊前往認證</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              )}
              {verificationStatus === "pending" && (
                <button
                  onClick={handleViewSubmittedData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold whitespace-nowrap leading-tight">商戶資料認證</div>
                    <div className="text-xs text-amber-600 leading-tight">審核中 — 點擊查看已提交資料</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              )}
              {verificationStatus === "rejected" && (
                <button
                  onClick={handleOpenVerification}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-semibold whitespace-nowrap leading-tight">商戶資料認證</div>
                    <div className="text-xs text-red-600 leading-tight">審核失敗 — 點擊重新提交</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
                </button>
              )}
              {verificationStatus === "verified" && (
                <button
                  onClick={handleOpenVerification}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-semibold whitespace-nowrap leading-tight">商戶資料認證</div>
                    <div className="text-xs text-green-600 leading-tight">已認證</div>
                  </div>
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">鴻</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">鴻圖科技有限公司</div>
                      <div className="text-xs text-slate-500">admin@hongtu.com</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>我的帳戶</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSecurityPanel(null); setShowAccountSettings(true); }}>
                    <Settings className="mr-2 h-4 w-4" /><span>帳戶設定</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLanguageModal(true)}>
                    <Globe className="mr-2 h-4 w-4" /><span>語言設置</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={() => navigate("/auth")}>
                    <LogOut className="mr-2 h-4 w-4" /><span>登出</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Quick Stats — above the primary CTA */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">快速統計</CardTitle>
                <CardDescription>您的招聘活動概覽</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: "12",  label: "活躍職位",  path: "/jobs",   accent: "text-blue-600" },
                    { value: "156", label: "收到申請",  path: "/talent", accent: "text-violet-600" },
                    { value: "3",   label: "待審核",    path: "/talent", accent: "text-amber-600" },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => navigate(s.path)}
                      className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                    >
                      <div className={`text-2xl font-semibold mb-1 ${s.accent}`}>{s.value}</div>
                      <div className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">{s.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Primary CTA */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-semibold text-slate-900">建立招聘職位</h2>
                    </div>
                    <p className="text-slate-600 mb-6 max-w-2xl">
                      快速發佈新職位空缺，即時接觸優質求職者。我們的平台將協助您找到合適的人才。
                    </p>
                    <Button
                      onClick={handleCreateJob}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      創建職位
                    </Button>
                  </div>
                  <div className="hidden xl:block">
                    <div className="w-48 h-48 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-24 h-24 text-blue-600 opacity-30" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Row — 待開發功能1 + 招聘額度總覽 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 待開發功能1 */}
              <Card className="shadow-sm border-dashed border-slate-300 hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-500">待開發功能 1</div>
                  <div className="text-xs text-slate-400 mt-1">敬請期待</div>
                </CardContent>
              </Card>

              <Card className={`shadow-sm hover:shadow-md transition-shadow ${creditUsagePercent >= 100 ? "border-red-300" : creditUsagePercent >= 85 ? "border-amber-300" : "border-slate-200"}`}>
                <CardHeader>
                  <CardTitle className="text-lg">招聘額度總覽</CardTitle>
                  <CardDescription>您的招聘信用額度使用情況</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">已使用額度</div>
                        <div className={`text-2xl font-semibold ${creditUsagePercent >= 100 ? "text-red-600" : "text-slate-900"}`}>
                          HK$ {usedCredit.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        creditUsagePercent >= 100
                          ? "border-red-200 text-red-700 bg-red-50"
                          : creditUsagePercent >= 85
                          ? "border-amber-200 text-amber-700 bg-amber-50"
                          : "border-blue-200 text-blue-700 bg-blue-50"
                      }>
                        {creditUsagePercent.toFixed(0)}% 已用
                      </Badge>
                    </div>
                    <Progress value={creditUsagePercent} className="h-2" />
                    {creditUsagePercent >= 100 ? (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        信用額度已耗盡，新職位發佈及申請管理功能暫停。請聯絡客服增加額度。
                      </div>
                    ) : creditUsagePercent >= 85 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        信用額度即將耗盡，建議提前聯絡客服申請增額。
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">剩餘額度</span>
                        <span className="font-semibold text-green-600">HK$ {remainingCredit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 待開發功能 2 / 3 / 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["待開發功能 2", "待開發功能 3", "待開發功能 4"].map((label) => (
                <Card key={label} className="shadow-sm border-dashed border-slate-300">
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-sm font-medium text-slate-500">{label}</div>
                    <div className="text-xs text-slate-400 mt-1">敬請期待</div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        </main>
      </div>

      {/* ════════════════════════════════════
          DIALOG: Create Job — pending verification
      ════════════════════════════════════ */}
      <Dialog open={showPendingAlert} onOpenChange={setShowPendingAlert}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              商業登記證審核中
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              您的商業登記證正在審核，預計需要 1–2 個工作天。審核通過後即可發佈職位。
            </DialogDescription>
          </div>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 text-center">
            如需加急處理，可聯絡客服申請優先審核
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowPendingAlert(false)}>
              知道了
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => { setShowPendingAlert(false); setShowSupportModal(true); }}
            >
              聯絡客服
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════
          DIALOG: Create Job — unverified alert
      ════════════════════════════════════ */}
      <Dialog open={showCreateJobAlert} onOpenChange={setShowCreateJobAlert}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              請先完成商戶認證
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              發佈職位需要先完成商戶認證，以確保平台雇主身份的真實性，保障雙方利益。
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreateJobAlert(false)}
            >
              稍後再說
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setShowCreateJobAlert(false);
                handleOpenVerification();
              }}
            >
              前往認證
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════
          DIALOG: Credit Limit Exceeded
      ════════════════════════════════════ */}
      <Dialog open={showCreditAlert} onOpenChange={setShowCreditAlert}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              授信額度已超出
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              目前已使用額度已超出授信上限，暫時無法發佈新職位。您可以聯絡平台客服申請提額，或先與平台完成結算後再發佈職位。
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreditAlert(false)}
            >
              稍後處理
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => { setShowCreditAlert(false); setShowSupportModal(true); }}
            >
              聯絡客服
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ContactSupportModal open={showSupportModal} onOpenChange={setShowSupportModal} />

      {/* ════════════════════════════════════
          DIALOG: Account Settings (Security only)
      ════════════════════════════════════ */}
      <Dialog open={showAccountSettings} onOpenChange={(o) => { setShowAccountSettings(o); if (!o) setSecurityPanel(null); }}>
        <DialogContent className="max-w-lg p-0 gap-0 flex flex-col" style={{ maxHeight: "90vh" }}>
          <div className="px-6 py-5 pr-14 border-b border-slate-200 shrink-0">
            <DialogTitle className="text-lg font-semibold text-slate-900">帳戶設定</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-0.5">管理帳號安全資訊</DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">

            {/* ── Change Email ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setSecurityPanel(p => p === "email" ? null : "email")}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-800">修改電子郵件</div>
                  <div className="text-xs text-slate-400 mt-0.5">{MOCK_EMAIL_MASKED}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${securityPanel === "email" ? "rotate-180" : ""}`} />
              </button>
              {securityPanel === "email" && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/50">
                  {emailChangeSuccess ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />電子郵件已成功更新
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">新電子郵件地址</Label>
                        <Input
                          type="email"
                          placeholder="輸入新電子郵件"
                          value={newEmail}
                          onChange={(e) => { setNewEmail(e.target.value); setNewEmailError(""); }}
                          className="bg-white"
                        />
                        {newEmailError && <p className="text-xs text-red-500">{newEmailError}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">驗證方式</Label>
                        <div className="flex gap-2">
                          {([{ v: "email", l: "驗證原電郵" }, { v: "phone", l: "驗證原手機號" }] as { v: "email" | "phone"; l: string }[]).map(opt => (
                            <button key={opt.v} type="button" onClick={() => { setEmailVerifyMethod(opt.v); setCeOtpSent(false); setCeOtp(""); setCeOtpError(""); }}
                              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${emailVerifyMethod === opt.v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">
                          {emailVerifyMethod === "email" ? `驗證碼將發送至：${MOCK_EMAIL_MASKED}` : `驗證碼將發送至：${MOCK_PHONE_MASKED}`}
                        </p>
                      </div>
                      {!ceOtpSent ? (
                        <button type="button" onClick={handleSendCeOtp}
                          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                          發送驗證碼
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">輸入驗證碼</Label>
                            <div className="flex gap-2">
                              <Input placeholder="6 位驗證碼" value={ceOtp} onChange={(e) => { setCeOtp(e.target.value); setCeOtpError(""); }} className="bg-white" maxLength={6} />
                              <button type="button" onClick={handleSendCeOtp} disabled={ceCooldown > 0}
                                className="shrink-0 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors">
                                {ceCooldown > 0 ? `${ceCooldown}s` : "重新發送"}
                              </button>
                            </div>
                            {ceOtpError && <p className="text-xs text-red-500">{ceOtpError}</p>}
                            <p className="text-xs text-slate-400">測試驗證碼：123456</p>
                          </div>
                          <button type="button" onClick={handleVerifyCeOtp}
                            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                            確認修改電子郵件
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Change Phone ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setSecurityPanel(p => p === "phone" ? null : "phone")}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-800">修改手機號碼</div>
                  <div className="text-xs text-slate-400 mt-0.5">{MOCK_PHONE_MASKED}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${securityPanel === "phone" ? "rotate-180" : ""}`} />
              </button>
              {securityPanel === "phone" && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/50">
                  {phoneChangeSuccess ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />手機號碼已成功更新
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">新手機號碼</Label>
                        <div className="flex gap-2">
                          <select value={newPhoneCode} onChange={(e) => setNewPhoneCode(e.target.value)}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                          </select>
                          <Input placeholder="輸入新手機號碼" value={newPhone} onChange={(e) => { setNewPhone(e.target.value); setNewPhoneError(""); }} className="bg-white flex-1" />
                        </div>
                        {newPhoneError && <p className="text-xs text-red-500">{newPhoneError}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">驗證方式</Label>
                        <div className="flex gap-2">
                          {([{ v: "phone", l: "驗證原手機號" }, { v: "email", l: "驗證原電郵" }] as { v: "phone" | "email"; l: string }[]).map(opt => (
                            <button key={opt.v} type="button" onClick={() => { setPhoneVerifyMethod(opt.v); setCpOtpSent(false); setCpOtp(""); setCpOtpError(""); }}
                              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${phoneVerifyMethod === opt.v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">
                          {phoneVerifyMethod === "phone" ? `驗證碼將發送至：${MOCK_PHONE_MASKED}` : `驗證碼將發送至：${MOCK_EMAIL_MASKED}`}
                        </p>
                      </div>
                      {!cpOtpSent ? (
                        <button type="button" onClick={handleSendCpOtp}
                          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                          發送驗證碼
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">輸入驗證碼</Label>
                            <div className="flex gap-2">
                              <Input placeholder="6 位驗證碼" value={cpOtp} onChange={(e) => { setCpOtp(e.target.value); setCpOtpError(""); }} className="bg-white" maxLength={6} />
                              <button type="button" onClick={handleSendCpOtp} disabled={cpCooldown > 0}
                                className="shrink-0 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors">
                                {cpCooldown > 0 ? `${cpCooldown}s` : "重新發送"}
                              </button>
                            </div>
                            {cpOtpError && <p className="text-xs text-red-500">{cpOtpError}</p>}
                            <p className="text-xs text-slate-400">測試驗證碼：123456</p>
                          </div>
                          <button type="button" onClick={handleVerifyCpOtp}
                            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                            確認修改手機號碼
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Change Password ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setSecurityPanel(p => p === "password" ? null : "password")}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-800">修改密碼</div>
                  <div className="text-xs text-slate-400 mt-0.5">上次修改：30 天前</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${securityPanel === "password" ? "rotate-180" : ""}`} />
              </button>
              {securityPanel === "password" && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/50">
                  {pwdSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />密碼已成功更新
                    </div>
                  )}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">驗證方式</Label>
                    <div className="flex gap-2">
                      {([{ v: "password", l: "填寫原密碼" }, { v: "phone", l: "手機號驗證" }] as { v: "password" | "phone"; l: string }[]).map(opt => (
                        <button key={opt.v} type="button"
                          onClick={() => { setPwdMethod(opt.v); setPwdError(""); setPpOtpSent(false); setPpOtp(""); setPpOtpError(""); }}
                          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${pwdMethod === opt.v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {pwdError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      <XCircle className="w-4 h-4 shrink-0" />{pwdError}
                    </div>
                  )}
                  {pwdMethod === "password" ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">目前密碼</Label>
                        <div className="relative">
                          <Input type={showCurrentPwd ? "text" : "password"} placeholder="輸入目前密碼" value={currentPwd}
                            onChange={(e) => { setCurrentPwd(e.target.value); if (pwdError) setPwdError(""); }} className="bg-white" />
                          <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                            {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">新密碼</Label>
                        <div className="relative">
                          <Input type={showNewPwd ? "text" : "password"} placeholder="至少 8 位，含字母及數字" value={newPwd}
                            onChange={(e) => { setNewPwd(e.target.value); if (pwdError) setPwdError(""); }} className="bg-white" />
                          <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                            {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {newPwd && (
                          <div className="flex gap-1 mt-1">
                            {[newPwd.length >= 8, /[A-Za-z]/.test(newPwd), /\d/.test(newPwd)].map((ok, i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-green-400" : "bg-slate-200"}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">確認新密碼</Label>
                        <div className="relative">
                          <Input type={showConfirmPwd ? "text" : "password"} placeholder="再次輸入新密碼" value={confirmPwd}
                            onChange={(e) => { setConfirmPwd(e.target.value); if (pwdError) setPwdError(""); }} className="bg-white" />
                          <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                            {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button type="button" onClick={handleChangePwd}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                        確認修改密碼
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">驗證碼將發送至：{MOCK_PHONE_MASKED}</p>
                      {!ppOtpSent ? (
                        <button type="button" onClick={handleSendPpOtp}
                          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                          發送驗證碼
                        </button>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">輸入驗證碼</Label>
                            <div className="flex gap-2">
                              <Input placeholder="6 位驗證碼" value={ppOtp} onChange={(e) => { setPpOtp(e.target.value); setPpOtpError(""); }} className="bg-white" maxLength={6} />
                              <button type="button" onClick={handleSendPpOtp} disabled={ppCooldown > 0}
                                className="shrink-0 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:opacity-50 hover:bg-slate-50">
                                {ppCooldown > 0 ? `${ppCooldown}s` : "重新發送"}
                              </button>
                            </div>
                            {ppOtpError && <p className="text-xs text-red-500">{ppOtpError}</p>}
                            <p className="text-xs text-slate-400">測試驗證碼：123456</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">新密碼</Label>
                            <div className="relative">
                              <Input type={showNewPwd ? "text" : "password"} placeholder="至少 8 位，含字母及數字" value={newPwd}
                                onChange={(e) => { setNewPwd(e.target.value); if (pwdError) setPwdError(""); }} className="bg-white" />
                              <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {newPwd && (
                              <div className="flex gap-1 mt-1">
                                {[newPwd.length >= 8, /[A-Za-z]/.test(newPwd), /\d/.test(newPwd)].map((ok, i) => (
                                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-green-400" : "bg-slate-200"}`} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">確認新密碼</Label>
                            <div className="relative">
                              <Input type={showConfirmPwd ? "text" : "password"} placeholder="再次輸入新密碼" value={confirmPwd}
                                onChange={(e) => { setConfirmPwd(e.target.value); if (pwdError) setPwdError(""); }} className="bg-white" />
                              <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <button type="button" onClick={handleChangePwdByPhone}
                            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                            確認修改密碼
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
            <button type="button" onClick={() => setShowAccountSettings(false)}
              className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              關閉
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════
          DIALOG: Language Options
      ════════════════════════════════════ */}
      <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
        <DialogContent className="max-w-sm p-0 gap-0 flex flex-col">
          <div className="px-6 py-5 pr-14 border-b border-slate-200 shrink-0">
            <DialogTitle className="text-lg font-semibold text-slate-900">語言設置</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-0.5">選擇介面顯示語言，立即生效</DialogDescription>
          </div>
          <div className="px-6 py-5 space-y-2">
            {LANG_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setUiLang(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  uiLang === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}>
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 opacity-60" />
                  {opt.label}
                </div>
                {uiLang === opt.value && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
            <button type="button" onClick={() => setShowLanguageModal(false)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              確認
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════
          DEBUG PANEL
      ════════════════════════════════════ */}
      <DebugPanel groups={[
        {
          title: "認證狀態",
          actions: [
            {
              label: "商業登記證 — 審核失敗",
              color: "red",
              action: () => {
                setRejectionReason("上傳的商業登記證文件模糊或資料不完整，請重新上傳清晰的原件掃描版本。");
                setVerificationStatus("rejected");
              },
            },
            {
              label: "重置為未認證",
              color: "slate",
              action: () => { setVerificationStatus("unverified"); setRejectionReason(""); },
            },
            {
              label: "設為審核中",
              color: "amber",
              action: () => { setVerificationStatus("pending"); setRejectionReason(""); },
            },
            {
              label: "設為已認證",
              color: "green",
              action: () => { setVerificationStatus("verified"); setRejectionReason(""); },
            },
          ],
        },
        {
          title: "信用額度",
          actions: [
            {
              label: "觸發額度警告（85%）",
              color: "amber",
              action: () => { setCreditLimit(100000); setUsedCredit(87000); },
            },
            {
              label: "觸發額度超限（100%）",
              color: "red",
              action: () => { setCreditLimit(100000); setUsedCredit(100000); },
            },
            {
              label: "重置正常額度",
              color: "slate",
              action: () => { setCreditLimit(100000); setUsedCredit(35000); },
            },
          ],
        },
      ]} />

      {/* ── Verification form is now at /merchant-profile page ── */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <div>
            {false ? (
              <div />
            ) : (
              <div className="space-y-8">
                {viewOnly && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <div className="text-sm text-amber-800">
                      <span className="font-semibold">審核中</span> — 資料已提交，預計 1–2 個工作天完成審核。審核期間資料不可修改。
                    </div>
                  </div>
                )}

                {/* Section 1: Basic Info */}
                <div>
                  <SectionTitle index={1} title="基本資料" desc="填寫公司基本信息，展示給求職者的公司形象" />
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="v-company-name">公司名稱 / 品牌</Label>
                      <Input
                        id="v-company-name"
                        placeholder="輸入公司名稱或品牌名稱"
                        disabled={viewOnly}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>公司 Logo / 商標</Label>
                      <div className="flex items-start gap-4">
                        <UploadArea
                          label="上傳 Logo"
                          hint="PNG / JPG"
                          accept="image/png,image/jpeg"
                          square
                          file={logoFile}
                          onChange={setLogoFile}
                        />
                        <div className="text-xs text-slate-500 pt-2 leading-relaxed">
                          建議尺寸 400×400px 以上<br />
                          格式：PNG 或 JPG<br />
                          大小：不超過 5MB
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="v-intro">公司介紹</Label>
                      <textarea
                        id="v-intro"
                        rows={4}
                        disabled={viewOnly}
                        placeholder="簡短介紹公司業務、文化及招聘方向（建議 50–200 字）"
                        value={companyIntro}
                        onChange={(e) => setCompanyIntro(e.target.value)}
                        className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none transition-[color,box-shadow] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="v-industry">公司行業</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={viewOnly}
                            onClick={() => !viewOnly && setCompanyIndustry(opt.value)}
                            className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                              companyIndustry === opt.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {companyIndustry === "other" && (
                        <Input
                          placeholder="請填寫所屬行業"
                          disabled={viewOnly}
                          value={industryOther}
                          onChange={(e) => setIndustryOther(e.target.value)}
                          className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="v-br-name">業務 / 法團所用名稱</Label>
                      <Input
                        id="v-br-name"
                        placeholder="輸入商業登記證上的正式名稱"
                        disabled={viewOnly}
                        value={brLegalName}
                        onChange={(e) => setBrLegalName(e.target.value)}
                        className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        請確保此名稱與商業登記證（BR）上的名稱完全一致
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Section 2: Documents */}
                <div>
                  <SectionTitle index={2} title="證明文件" desc="上傳有效的商業登記證以驗證企業身份" />
                  <div className="space-y-2">
                    <Label>商業登記證（BR）</Label>
                    <UploadArea
                      label="點擊上傳商業登記證"
                      hint="支持 PDF、PNG、JPG 格式，大小不超過 10MB"
                      accept=".pdf,image/png,image/jpeg"
                      file={brFile}
                      onChange={setBrFile}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Section 3: Employee Count */}
                <div>
                  <SectionTitle index={3} title="員工人數" desc="選擇您公司目前的員工規模" />
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {EMPLOYEE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={viewOnly}
                        onClick={() => !viewOnly && setEmployeeCount(opt.value)}
                        className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          employeeCount === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Section 4: Contact Info */}
                <div>
                  <SectionTitle index={4} title="聯絡資訊" desc="提供公司聯絡人及地址，方便我們與您保持溝通" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="v-contact-name">聯絡人姓名</Label>
                        <Input
                          id="v-contact-name"
                          placeholder="輸入姓名"
                          disabled={viewOnly}
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="v-contact-title">職位</Label>
                        <Input
                          id="v-contact-title"
                          placeholder="例：HR Manager"
                          disabled={viewOnly}
                          value={contactTitle}
                          onChange={(e) => setContactTitle(e.target.value)}
                          className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                    {/* ── Email field with OTP ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="v-contact-email">電郵地址</Label>
                        {emailVerified && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />已驗證
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="v-contact-email"
                          type="email"
                          placeholder="your@company.com"
                          disabled={viewOnly || emailVerified}
                          value={contactEmail}
                          onChange={(e) => { setContactEmail(e.target.value); if (contactEmailError) setContactEmailError(""); setEmailOtpSent(false); setEmailVerified(false); }}
                          className={`disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50 ${contactEmailError ? "border-red-400" : ""}`}
                        />
                        {!viewOnly && !emailVerified && (
                          <button
                            type="button"
                            disabled={emailCooldown > 0}
                            onClick={handleSendEmailOtp}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" />
                            {emailCooldown > 0 ? `${emailCooldown}s` : emailOtpSent ? "重新發送" : "發送驗證碼"}
                          </button>
                        )}
                      </div>
                      {contactEmailError && <p className="text-xs text-red-500">{contactEmailError}</p>}
                      {emailOtpSent && !emailVerified && !viewOnly && (
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Input
                              placeholder="輸入 6 位驗證碼"
                              maxLength={6}
                              value={emailOtp}
                              onChange={(e) => { setEmailOtp(e.target.value.replace(/\D/g, "")); if (emailOtpError) setEmailOtpError(""); }}
                              className={emailOtpError ? "border-red-400" : ""}
                            />
                            {emailOtpError && <p className="text-xs text-red-500">{emailOtpError}</p>}
                            <p className="text-xs text-slate-400">驗證碼已發送至 {contactEmail}（測試碼：123456）</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyEmailOtp}
                            className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                          >
                            確認驗證
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Phone field with country code + OTP ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="v-contact-phone">聯絡電話</Label>
                        {phoneVerified && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />已驗證
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {/* Country code selector */}
                        <div className="relative shrink-0">
                          <select
                            value={contactPhoneCode}
                            onChange={(e) => { setContactPhoneCode(e.target.value); setPhoneOtpSent(false); setPhoneVerified(false); }}
                            disabled={viewOnly || phoneVerified}
                            className="h-10 appearance-none rounded-md border border-input bg-slate-50 pl-2 pr-6 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-3 h-3.5 w-3.5 text-slate-400" />
                        </div>
                        {/* Phone number input */}
                        <Input
                          id="v-contact-phone"
                          type="tel"
                          placeholder="xxxx xxxx"
                          disabled={viewOnly || phoneVerified}
                          value={contactPhone}
                          onChange={(e) => { setContactPhone(e.target.value); if (contactPhoneError) setContactPhoneError(""); setPhoneOtpSent(false); setPhoneVerified(false); }}
                          className={`flex-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50 ${contactPhoneError ? "border-red-400" : ""}`}
                        />
                        {!viewOnly && !phoneVerified && (
                          <button
                            type="button"
                            disabled={phoneCooldown > 0}
                            onClick={handleSendPhoneOtp}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" />
                            {phoneCooldown > 0 ? `${phoneCooldown}s` : phoneOtpSent ? "重新發送" : "發送驗證碼"}
                          </button>
                        )}
                      </div>
                      {contactPhoneError && <p className="text-xs text-red-500">{contactPhoneError}</p>}
                      {phoneOtpSent && !phoneVerified && !viewOnly && (
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Input
                              placeholder="輸入 6 位驗證碼"
                              maxLength={6}
                              value={phoneOtp}
                              onChange={(e) => { setPhoneOtp(e.target.value.replace(/\D/g, "")); if (phoneOtpError) setPhoneOtpError(""); }}
                              className={phoneOtpError ? "border-red-400" : ""}
                            />
                            {phoneOtpError && <p className="text-xs text-red-500">{phoneOtpError}</p>}
                            <p className="text-xs text-slate-400">驗證碼已發送至 {contactPhoneCode} {contactPhone}（測試碼：123456）</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyPhoneOtp}
                            className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                          >
                            確認驗證
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="v-address">公司地址</Label>
                      <Input
                        id="v-address"
                        placeholder="例：香港九龍觀塘道 xxx 號 xx 樓"
                        disabled={viewOnly}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
