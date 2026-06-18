import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Upload, FileText, ImageIcon, AlertTriangle, CheckCircle2, Send,
  ChevronDown, Bell,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications } from "../contexts/notification-context";

// ── Types & constants ─────────────────────────────────────

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

function validateHKPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 8 || (digits.length === 11 && digits.startsWith("852"));
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Sub-components ────────────────────────────────────────

function SectionCard({ index, title, desc, children }: {
  index: number; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
          {index}
        </div>
        <div>
          <div className="font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function UploadArea({
  label, hint, accept, square = false, file, onChange, disabled,
}: {
  label: string; hint: string; accept: string;
  square?: boolean; file: File | null;
  onChange: (f: File) => void; disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const previewUrl = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
        square ? "w-28 h-28" : "w-full py-8"
      } ${
        disabled
          ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-70"
          : file
            ? "border-blue-300 bg-blue-50/50 cursor-pointer hover:border-blue-400"
            : "border-slate-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
      }`}
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

// ── Main Page ─────────────────────────────────────────────

export function MerchantProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewOnly: boolean = (location.state as { viewOnly?: boolean } | null)?.viewOnly ?? false;

  const { unreadTalentCount, unreadCount } = useNotifications();

  const [formSubmitted, setFormSubmitted] = useState(false);

  // Form fields
  const [companyName, setCompanyName]         = useState("");
  const [companyNameEn, setCompanyNameEn]     = useState("");
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
  const [logoFile, setLogoFile]               = useState<File | null>(null);
  const [brFile, setBrFile]                   = useState<File | null>(null);

  // OTP state
  const MOCK_OTP = "123456";
  const [emailOtpSent, setEmailOtpSent]   = useState(false);
  const [emailOtp, setEmailOtp]           = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [phoneOtpSent, setPhoneOtpSent]   = useState(false);
  const [phoneOtp, setPhoneOtp]           = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [phoneCooldown, setPhoneCooldown] = useState(0);

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
    setEmailOtpSent(true); setEmailOtp(""); setEmailOtpError(""); setEmailCooldown(60);
  };
  const handleVerifyEmailOtp = () => {
    if (emailOtp === MOCK_OTP) { setEmailVerified(true); setEmailOtpError(""); }
    else { setEmailOtpError("驗證碼錯誤，請重新輸入"); }
  };
  const handleSendPhoneOtp = () => {
    const isHK = contactPhoneCode === "+852";
    if (isHK && !validateHKPhone(contactPhone)) { setContactPhoneError("請先輸入有效的香港電話號碼（8 位數字）"); return; }
    if (!isHK && contactPhone.replace(/\D/g, "").length < 6) { setContactPhoneError("請輸入有效的電話號碼"); return; }
    setContactPhoneError("");
    setPhoneOtpSent(true); setPhoneOtp(""); setPhoneOtpError(""); setPhoneCooldown(60);
  };
  const handleVerifyPhoneOtp = () => {
    if (phoneOtp === MOCK_OTP) { setPhoneVerified(true); setPhoneOtpError(""); }
    else { setPhoneOtpError("驗證碼錯誤，請重新輸入"); }
  };

  const handleSubmit = () => {
    let hasError = false;
    if (contactEmail && !emailVerified) { setContactEmailError("請先完成電郵驗證"); hasError = true; }
    if (contactPhone && !phoneVerified) { setContactPhoneError("請先完成電話驗證"); hasError = true; }
    if (hasError) return;
    setFormSubmitted(true);
  };

  const handleDone = () => {
    navigate("/dashboard", { state: { verificationSubmitted: true } });
  };


  return (
    <div className="min-h-screen bg-slate-50 flex">

      <Sidebar />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">返回工作台</span>
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {viewOnly ? "已提交的認證資料" : "商戶資料認證"}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {viewOnly
                    ? "以下為您已提交的認證資料，審核期間不可修改"
                    : "完成認證後可使用完整平台功能"}
                </p>
              </div>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-auto p-8">
          {formSubmitted ? (
            /* ── Success State ── */
            <div className="max-w-lg mx-auto mt-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-11 h-11 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">認證資料已提交</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                我們將在 1–2 個工作天內完成審核，請留意帳戶通知。<br />審核期間您可繼續瀏覽平台功能。
              </p>
              <Button onClick={handleDone} className="bg-blue-600 hover:bg-blue-700 px-10">
                返回工作台
              </Button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 pb-24">

              {viewOnly && (
                <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <div className="text-sm text-amber-800">
                    <span className="font-semibold">審核中</span> — 資料已提交，預計 1–2 個工作天完成審核。審核期間資料不可修改。
                  </div>
                </div>
              )}

              {/* Section 1: Basic Info */}
              <SectionCard index={1} title="基本資料" desc="填寫公司基本信息，展示給求職者的公司形象">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="v-company-name">
                      公司名稱 / 品牌<span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                      id="v-company-name"
                      placeholder="輸入公司名稱或品牌名稱"
                      disabled={viewOnly}
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="v-company-name-en">
                      公司名稱 / 品牌英文名<span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                      id="v-company-name-en"
                      placeholder="Enter company or brand name in English"
                      disabled={viewOnly}
                      value={companyNameEn}
                      onChange={e => setCompanyNameEn(e.target.value)}
                      className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <p className="text-xs text-slate-400">請以英文填寫，用於對外展示及官方文件（例：NewBee Technology Limited）</p>
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
                        disabled={viewOnly}
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
                      onChange={e => setCompanyIntro(e.target.value)}
                      className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none transition-[color,box-shadow] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>公司行業</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {INDUSTRY_OPTIONS.map(opt => (
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
                        onChange={e => setIndustryOther(e.target.value)}
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
                      onChange={e => setBrLegalName(e.target.value)}
                      className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      請確保此名稱與商業登記證（BR）上的名稱完全一致
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Section 2: Documents */}
              <SectionCard index={2} title="證明文件" desc="上傳有效的商業登記證以驗證企業身份">
                <div className="space-y-2">
                  <Label>商業登記證（BR）</Label>
                  <UploadArea
                    label="點擊上傳商業登記證"
                    hint="支持 PDF、PNG、JPG 格式，大小不超過 10MB"
                    accept=".pdf,image/png,image/jpeg"
                    file={brFile}
                    onChange={setBrFile}
                    disabled={viewOnly}
                  />
                </div>
              </SectionCard>

              {/* Section 3: Employee Count */}
              <SectionCard index={3} title="員工人數" desc="選擇您公司目前的員工規模">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {EMPLOYEE_OPTIONS.map(opt => (
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
              </SectionCard>

              {/* Section 4: Contact Info */}
              <SectionCard index={4} title="聯絡資訊" desc="提供公司聯絡人及地址，方便我們與您保持溝通">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="v-contact-name">聯絡人姓名</Label>
                      <Input
                        id="v-contact-name"
                        placeholder="輸入姓名"
                        disabled={viewOnly}
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
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
                        onChange={e => setContactTitle(e.target.value)}
                        className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Email + OTP */}
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
                        onChange={e => { setContactEmail(e.target.value); if (contactEmailError) setContactEmailError(""); setEmailOtpSent(false); setEmailVerified(false); }}
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
                            onChange={e => { setEmailOtp(e.target.value.replace(/\D/g, "")); if (emailOtpError) setEmailOtpError(""); }}
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

                  {/* Phone + OTP */}
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
                      <div className="relative shrink-0">
                        <select
                          value={contactPhoneCode}
                          onChange={e => { setContactPhoneCode(e.target.value); setPhoneOtpSent(false); setPhoneVerified(false); }}
                          disabled={viewOnly || phoneVerified}
                          className="h-10 appearance-none rounded-md border border-input bg-slate-50 pl-2 pr-6 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 top-3 h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <Input
                        id="v-contact-phone"
                        type="tel"
                        placeholder="xxxx xxxx"
                        disabled={viewOnly || phoneVerified}
                        value={contactPhone}
                        onChange={e => { setContactPhone(e.target.value); if (contactPhoneError) setContactPhoneError(""); setPhoneOtpSent(false); setPhoneVerified(false); }}
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
                            onChange={e => { setPhoneOtp(e.target.value.replace(/\D/g, "")); if (phoneOtpError) setPhoneOtpError(""); }}
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
                      onChange={e => setAddress(e.target.value)}
                      className="disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </SectionCard>

            </div>
          )}
        </main>

        {/* Sticky footer */}
        {!formSubmitted && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-10">
            <p className="text-xs text-slate-400">帶 <span className="text-red-500">*</span> 號為必填項目</p>
            <div className="flex gap-3">
              {viewOnly ? (
                <Button variant="outline" onClick={() => navigate("/dashboard")}>關閉</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>取消</Button>
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 px-8">
                    提交認證
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
