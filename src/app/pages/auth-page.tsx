import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import {
  Shield, Phone, Building2, Mail, Lock,
  CheckCircle2, ArrowLeft, Eye, EyeOff, KeyRound, ChevronDown,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ContactSupportModal } from "../components/ContactSupportModal";

type TopView = "tabs" | "forgot";
type ForgotStep = "verify" | "setPassword";
type LoginMethod = "email" | "phone";
type RegisterStep = "info" | "setPassword";

const COUNTRY_CODES = [
  { code: "+852", flag: "🇭🇰", name: "HK" },
  { code: "+86",  flag: "🇨🇳", name: "CN" },
  { code: "+886", flag: "🇹🇼", name: "TW" },
  { code: "+65",  flag: "🇸🇬", name: "SG" },
  { code: "+1",   flag: "🇺🇸", name: "US" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
];

// Phone field with country code selector + number input + optional send button
function PhoneField({
  disabled = false,
  countdown = 0,
  otpSent = false,
  onSend,
}: {
  disabled?: boolean;
  countdown?: number;
  otpSent?: boolean;
  onSend?: () => void;
}) {
  const [code, setCode] = useState("+852");
  const sendLabel = countdown > 0 ? `${countdown}s` : otpSent ? "重新發送" : "發送驗證碼";

  return (
    <div className="flex gap-2">
      {/* Country code select */}
      <div className="relative shrink-0">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={disabled}
          className="h-10 appearance-none rounded-md border border-input bg-slate-50 pl-2 pr-6 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-3 h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Phone number input */}
      <Input
        type="tel"
        placeholder="xxxx xxxx"
        disabled={disabled}
        className="flex-1"
      />

      {/* Send OTP button — only rendered if onSend is provided */}
      {onSend && (
        <Button
          type="button"
          onClick={onSend}
          disabled={countdown > 0 || disabled}
          variant="outline"
          className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-3 whitespace-nowrap"
        >
          {sendLabel}
        </Button>
      )}
    </div>
  );
}

// OTP input row — always rendered, dimmed until code is sent
function OtpInput({
  otp,
  setOtp,
  sent,
}: {
  otp: string;
  setOtp: (v: string) => void;
  sent: boolean;
}) {
  return (
    <div
      className={`space-y-2 transition-opacity duration-200 ${
        !sent ? "opacity-40 pointer-events-none select-none" : ""
      }`}
    >
      <Label>驗證碼</Label>
      <InputOTP maxLength={6} value={otp} onChange={setOtp} className="justify-center">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-slate-500 text-center">
        {sent ? "驗證碼已發送至您的手機" : "請先發送驗證碼"}
      </p>
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function MethodToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all ${
            value === opt.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function startCountdown(setter: React.Dispatch<React.SetStateAction<number>>) {
  setter(60);
  const id = setInterval(() => {
    setter((prev) => {
      if (prev <= 1) { clearInterval(id); return 0; }
      return prev - 1;
    });
  }, 1000);
}

export function AuthPage() {
  const navigate = useNavigate();

  const [topView, setTopView]     = useState<TopView>("tabs");
  const [activeTab, setActiveTab] = useState("login");
  const [showSupportModal, setShowSupportModal] = useState(false);

  // ── Login
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent]         = useState(false);
  const [phoneOtp, setPhoneOtp]                 = useState("");
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);

  // ── Forgot password
  const [forgotStep, setForgotStep]     = useState<ForgotStep>("verify");
  const [forgotMethod, setForgotMethod] = useState<"phone" | "email">("phone");
  const [forgotOtpSent, setForgotOtpSent]         = useState(false);
  const [forgotOtp, setForgotOtp]                 = useState("");
  const [forgotCountdown, setForgotCountdown]     = useState(0);
  const [showNewPwd, setShowNewPwd]       = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ── Register
  const [registerStep, setRegisterStep] = useState<RegisterStep>("info");
  const [regOtpSent, setRegOtpSent]         = useState(false);
  const [regOtp, setRegOtp]                 = useState("");
  const [regCountdown, setRegCountdown]     = useState(0);
  const [showRegPwd, setShowRegPwd]             = useState(false);
  const [showRegConfirmPwd, setShowRegConfirmPwd] = useState(false);

  // ── Handlers: login
  const handleLogin = () => navigate("/dashboard");
  const handlePhoneSendOtp = () => { setPhoneOtpSent(true); startCountdown(setPhoneOtpCountdown); };
  const handleLoginMethodChange = (m: string) => {
    setLoginMethod(m as LoginMethod);
    setPhoneOtpSent(false); setPhoneOtp(""); setPhoneOtpCountdown(0);
  };

  // ── Handlers: forgot password
  const handleForgotOpen = () => {
    setTopView("forgot"); setForgotStep("verify");
    setForgotOtpSent(false); setForgotOtp(""); setForgotCountdown(0);
  };
  const handleBackToLogin = () => {
    setTopView("tabs"); setForgotStep("verify");
    setForgotOtpSent(false); setForgotOtp(""); setForgotCountdown(0);
  };
  const handleForgotSendOtp = () => { setForgotOtpSent(true); startCountdown(setForgotCountdown); };
  const handleForgotMethodChange = (m: string) => {
    setForgotMethod(m as "phone" | "email");
    setForgotOtpSent(false); setForgotOtp(""); setForgotCountdown(0);
  };
  const handleForgotVerify   = () => setForgotStep("setPassword");
  const handleForgotComplete = () => navigate("/dashboard");

  // ── Handlers: register
  const handleRegSendOtp   = () => { setRegOtpSent(true); startCountdown(setRegCountdown); };
  const handleRegVerify    = () => setRegisterStep("setPassword");
  const handleBackToRegInfo = () => { setRegisterStep("info"); setRegOtpSent(false); setRegOtp(""); setRegCountdown(0); };
  const handleRegComplete  = () => navigate("/dashboard");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1763318024355-633f41127eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25nJTIwa29uZyUyMGJ1c2luZXNzJTIwc2t5bGluZXxlbnwxfHx8fDE3ODEyNjg4MDF8MA&ixlib=rb-4.1.0&q=80&w=1920&utm_source=figma&utm_medium=referral"
          alt="Hong Kong Business"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/60 to-slate-800/70" />
      </div>

      <div className="relative z-10 min-h-screen flex items-stretch">

        {/* ── Left: branding */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold">NewBee</span>
            </div>
            <p className="text-sm text-blue-100 ml-12">商戶招聘管理平台</p>
          </div>
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold mb-4 leading-tight">
                專業招聘管理<br />值得信賴的夥伴
              </h1>
              <p className="text-lg text-blue-100 max-w-md">
                為香港企業提供高效、可靠的人力資源招聘解決方案
              </p>
            </div>
            <div className="space-y-4">
              {[
                { title: "企業級安全保障", desc: "銀行級數據加密，保護您的商業資料" },
                { title: "即時職位發佈",   desc: "快速觸及優質求職者，提升招聘效率" },
                { title: "專業客戶支援",   desc: "專屬客戶經理，全程協助您的招聘需求" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-blue-200">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" /><span>ISO 27001 認證</span>
            </div>
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" /><span>聯絡客服</span>
            </button>
          </div>
        </div>

        {/* ── Right: floating card */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6">
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 3rem)" }}
          >
            {/* Mobile brand */}
            <div className="lg:hidden mb-6 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-slate-900">NewBee</span>
              </div>
              <p className="text-xs text-slate-500">商戶招聘管理平台</p>
            </div>

            {/* ════ TABS VIEW ════ */}
            {topView === "tabs" && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">登入</TabsTrigger>
                  <TabsTrigger value="register">註冊商戶</TabsTrigger>
                </TabsList>

                {/* ── Login Tab ── */}
                <TabsContent value="login">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">商戶登入</h2>
                    <p className="text-sm text-slate-500">使用您的商戶帳戶登入平台</p>
                  </div>

                  <MethodToggle
                    value={loginMethod}
                    onChange={handleLoginMethodChange}
                    options={[
                      { value: "email", label: "電郵登入", icon: <Mail className="w-3.5 h-3.5" /> },
                      { value: "phone", label: "手機登入", icon: <Phone className="w-3.5 h-3.5" /> },
                    ]}
                  />

                  {loginMethod === "email" ? (
                    /* Email + password */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">電郵地址</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="login-email" type="email" placeholder="your.name@company.com" className="pl-10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">密碼</Label>
                          <button
                            onClick={handleForgotOpen}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            忘記密碼？
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="login-password"
                            type={showLoginPwd ? "text" : "password"}
                            placeholder="輸入您的密碼"
                            className="pl-10 pr-10"
                          />
                          <EyeToggle show={showLoginPwd} onToggle={() => setShowLoginPwd((v) => !v)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Phone + OTP — always two rows, OTP dimmed until sent */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>手機號碼</Label>
                        <PhoneField
                          countdown={phoneOtpCountdown}
                          otpSent={phoneOtpSent}
                          onSend={handlePhoneSendOtp}
                          disabled={false}
                        />
                      </div>
                      <OtpInput otp={phoneOtp} setOtp={setPhoneOtp} sent={phoneOtpSent} />
                    </div>
                  )}

                  <div className="mt-5">
                    <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700">
                      登入
                    </Button>
                  </div>
                </TabsContent>

                {/* ── Register Tab ── */}
                <TabsContent value="register">
                  {registerStep === "info" && (
                    <div>
                      <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">註冊商戶帳戶</h2>
                        <p className="text-sm text-slate-500">建立您的企業招聘帳戶</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-name">公司名稱 / 品牌</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="company-name" type="text" placeholder="輸入公司名稱或品牌名" className="pl-10" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>手機號碼</Label>
                          <PhoneField
                            countdown={regCountdown}
                            otpSent={regOtpSent}
                            onSend={handleRegSendOtp}
                          />
                        </div>
                        <OtpInput otp={regOtp} setOtp={setRegOtp} sent={regOtpSent} />
                      </div>
                      <div className="mt-5">
                        <Button
                          onClick={handleRegVerify}
                          disabled={!regOtpSent}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          驗證並繼續
                        </Button>
                      </div>
                    </div>
                  )}

                  {registerStep === "setPassword" && (
                    <div>
                      <button
                        onClick={handleBackToRegInfo}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />返回
                      </button>
                      <div className="mb-5">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">設定登入密碼</h2>
                        <p className="text-sm text-slate-500">手機驗證成功，請設定您的帳戶密碼</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-password">登入密碼</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                              id="reg-password"
                              type={showRegPwd ? "text" : "password"}
                              placeholder="至少 8 位字元"
                              className="pl-10 pr-10"
                            />
                            <EyeToggle show={showRegPwd} onToggle={() => setShowRegPwd((v) => !v)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-confirm">確認密碼</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                              id="reg-confirm"
                              type={showRegConfirmPwd ? "text" : "password"}
                              placeholder="再次輸入密碼"
                              className="pl-10 pr-10"
                            />
                            <EyeToggle show={showRegConfirmPwd} onToggle={() => setShowRegConfirmPwd((v) => !v)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-col gap-3">
                        <p className="text-xs text-slate-500 text-center">
                          註冊即表示您同意我們的
                          <button className="text-blue-600 hover:text-blue-700 mx-1">服務條款</button>
                          及
                          <button className="text-blue-600 hover:text-blue-700 mx-1">私隱政策</button>
                        </p>
                        <Button onClick={handleRegComplete} className="w-full bg-blue-600 hover:bg-blue-700">
                          建立帳戶
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* ════ FORGOT PASSWORD VIEW ════ */}
            {topView === "forgot" && (
              <div>
                <button
                  onClick={handleBackToLogin}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />返回登入
                </button>

                {/* Step 1: Verify identity */}
                {forgotStep === "verify" && (
                  <div>
                    <div className="mb-5">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                        <KeyRound className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">重設密碼</h2>
                      <p className="text-sm text-slate-500">驗證您的身份後即可設定新密碼</p>
                    </div>

                    <MethodToggle
                      value={forgotMethod}
                      onChange={handleForgotMethodChange}
                      options={[
                        { value: "phone", label: "手機驗證", icon: <Phone className="w-3.5 h-3.5" /> },
                        { value: "email", label: "電郵驗證", icon: <Mail className="w-3.5 h-3.5" /> },
                      ]}
                    />

                    <div className="space-y-4">
                      {forgotMethod === "phone" ? (
                        <div className="space-y-2">
                          <Label>手機號碼</Label>
                          <PhoneField
                            countdown={forgotCountdown}
                            otpSent={forgotOtpSent}
                            onSend={handleForgotSendOtp}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>電郵地址</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input
                                type="email"
                                placeholder="your.name@company.com"
                                className="pl-10"
                                disabled={forgotOtpSent}
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={handleForgotSendOtp}
                              disabled={forgotCountdown > 0}
                              variant="outline"
                              className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-3 whitespace-nowrap"
                            >
                              {forgotCountdown > 0 ? `${forgotCountdown}s` : forgotOtpSent ? "重新發送" : "發送驗證碼"}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div
                        className={`space-y-2 transition-opacity duration-200 ${
                          !forgotOtpSent ? "opacity-40 pointer-events-none select-none" : ""
                        }`}
                      >
                        <Label>驗證碼</Label>
                        <InputOTP maxLength={6} value={forgotOtp} onChange={setForgotOtp} className="justify-center">
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                        <p className="text-xs text-slate-500 text-center">
                          {forgotOtpSent
                            ? `驗證碼已發送至您的${forgotMethod === "phone" ? "手機" : "電郵"}`
                            : "請先發送驗證碼"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Button
                        onClick={handleForgotVerify}
                        disabled={!forgotOtpSent}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        驗證並繼續
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Set new password */}
                {forgotStep === "setPassword" && (
                  <div>
                    <div className="mb-5">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">設定新密碼</h2>
                      <p className="text-sm text-slate-500">身份驗證成功，請設定您的新密碼</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">新密碼</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="new-password"
                            type={showNewPwd ? "text" : "password"}
                            placeholder="至少 8 位字元"
                            className="pl-10 pr-10"
                          />
                          <EyeToggle show={showNewPwd} onToggle={() => setShowNewPwd((v) => !v)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">確認新密碼</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPwd ? "text" : "password"}
                            placeholder="再次輸入新密碼"
                            className="pl-10 pr-10"
                          />
                          <EyeToggle show={showConfirmPwd} onToggle={() => setShowConfirmPwd((v) => !v)} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <Button onClick={handleForgotComplete} className="w-full bg-blue-600 hover:bg-blue-700">
                        確認並登入
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {topView === "tabs" && (
              <div className="mt-5 text-center text-sm text-slate-500">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-4 h-4" />
                  <span>企業級安全登入</span>
                </div>
                <p>
                  需要協助？聯絡我們：
                  <a href="tel:34688888" className="text-blue-600 hover:text-blue-700">3468 8888</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ContactSupportModal open={showSupportModal} onOpenChange={setShowSupportModal} />
    </div>
  );
}
