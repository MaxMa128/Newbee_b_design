import { useState, useRef } from "react";
import {
  LayoutDashboard, Briefcase, Plus, CheckCircle2, Clock, AlertCircle,
  ChevronRight, User, Settings, LogOut, Bell, Building2,
  Upload, FileText, AlertTriangle, ImageIcon,
} from "lucide-react";
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

type VerificationStatus = "unverified" | "pending" | "verified";

const EMPLOYEE_OPTIONS = [
  { value: "1-20",    label: "1–20 人" },
  { value: "21-50",   label: "21–50 人" },
  { value: "51-100",  label: "51–100 人" },
  { value: "100-500", label: "100–500 人" },
  { value: "500+",    label: "500 人以上" },
];

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
  const [activeNav, setActiveNav] = useState("dashboard");

  // Verification state — start as unverified per requirement
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showCreateJobAlert, setShowCreateJobAlert] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Verification form fields
  const [companyName, setCompanyName]     = useState("");
  const [companyIntro, setCompanyIntro]   = useState("");
  const [brLegalName, setBrLegalName]     = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [contactName, setContactName]     = useState("");
  const [contactEmail, setContactEmail]   = useState("");
  const [contactTitle, setContactTitle]   = useState("");
  const [contactPhone, setContactPhone]   = useState("");
  const [address, setAddress]             = useState("");
  const [logoFile, setLogoFile]           = useState<File | null>(null);
  const [brFile, setBrFile]               = useState<File | null>(null);

  // Credit data
  const creditLimit          = 100000;
  const usedCredit           = 35000;
  const remainingCredit      = creditLimit - usedCredit;
  const creditUsagePercent   = (usedCredit / creditLimit) * 100;

  const handleOpenVerification = () => {
    setFormSubmitted(false);
    setShowVerificationForm(true);
  };

  const handleCreateJob = () => {
    if (verificationStatus !== "verified") {
      setShowCreateJobAlert(true);
    }
    // else: navigate to create job page
  };

  const handleSubmitVerification = () => {
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
        <div className="text-xs text-slate-400 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-xs text-slate-600 font-medium">未認證</span>
          </div>
          <button
            onClick={handleOpenVerification}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            去認證 →
          </button>
        </div>
      </div>
    );
    if (verificationStatus === "pending") return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-400 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-700 font-medium">審核中</span>
          </div>
          <span className="text-xs text-slate-400">1–2 工作天</span>
        </div>
      </div>
    );
    return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-400 mb-1.5">商業登記證</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-green-700 font-medium">已認證</span>
          </div>
          <button
            onClick={handleOpenVerification}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
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

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
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
          {sidebarVerificationBadge()}
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {[
              { key: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "工作台" },
              { key: "jobs",      icon: <Briefcase className="w-5 h-5" />,       label: "職位管理" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeNav === item.key
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

        <div className="p-4 border-t border-slate-200">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-sm font-medium text-slate-900 mb-1">需要協助？</div>
            <div className="text-xs text-slate-600 mb-3">聯絡我們的專業團隊</div>
            <Button variant="outline" size="sm" className="w-full text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
              聯絡客服
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">工作台</h1>
              <p className="text-sm text-slate-500 mt-0.5">歡迎回來，管理您的招聘職位</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
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
                  <DropdownMenuItem><User className="mr-2 h-4 w-4" /><span>個人資料</span></DropdownMenuItem>
                  <DropdownMenuItem><Building2 className="mr-2 h-4 w-4" /><span>商戶資料</span></DropdownMenuItem>
                  <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /><span>帳戶設定</span></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600"><LogOut className="mr-2 h-4 w-4" /><span>登出</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">

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

            {/* Status Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">認證狀態</CardTitle>
                  <CardDescription>您的商戶帳戶認證狀態</CardDescription>
                </CardHeader>
                <CardContent>{dashboardVerificationCard()}</CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">招聘額度總覽</CardTitle>
                  <CardDescription>您的招聘信用額度使用情況</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">已使用額度</div>
                        <div className="text-2xl font-semibold text-slate-900">
                          HK$ {usedCredit.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                        {creditUsagePercent.toFixed(0)}% 已用
                      </Badge>
                    </div>
                    <Progress value={creditUsagePercent} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">剩餘額度</span>
                      <span className="font-semibold text-green-600">HK$ {remainingCredit.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credit Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "信用額度",   value: creditLimit,     color: "text-slate-900",  sub: "總招聘信用額度" },
                { label: "已使用額度", value: usedCredit,      color: "text-orange-600", sub: "本月已使用招聘額度" },
                { label: "剩餘額度",   value: remainingCredit, color: "text-green-600",  sub: "可用招聘額度" },
              ].map((item) => (
                <Card key={item.label} className="shadow-sm border-slate-200">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">{item.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-semibold mb-2 ${item.color}`}>
                      HK$ {item.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">{item.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">快速統計</CardTitle>
                <CardDescription>您的招聘活動概覽</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { value: "12",  label: "活躍職位" },
                    { value: "156", label: "收到申請" },
                    { value: "8",   label: "待面試" },
                    { value: "3",   label: "待回覆" },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-semibold text-slate-900 mb-1">{s.value}</div>
                      <div className="text-sm text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

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
          DIALOG: Verification Form
      ════════════════════════════════════ */}
      <Dialog open={showVerificationForm} onOpenChange={(open) => { if (!open) { setShowVerificationForm(false); setFormSubmitted(false); } }}>
        <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col" style={{ maxHeight: "92vh" }}>

          {/* Sticky header — pr-14 leaves room for the built-in close button */}
          <div className="px-7 py-5 pr-14 border-b border-slate-200 shrink-0">
            <DialogTitle className="text-lg font-semibold text-slate-900">商戶認證</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-0.5">
              完成認證後可使用完整平台功能
            </DialogDescription>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-7 py-6">
            {formSubmitted ? (
              /* ── Success State ── */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">認證資料已提交</h3>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  我們將在 1–2 個工作天內完成審核，請留意帳戶通知。審核期間您可繼續瀏覽平台功能。
                </p>
              </div>
            ) : (
              /* ── Form ── */
              <div className="space-y-8">

                {/* Section 1: Basic Info */}
                <div>
                  <SectionTitle index={1} title="基本資料" desc="填寫公司基本信息，展示給求職者的公司形象" />
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="v-company-name">公司名稱 / 品牌</Label>
                      <Input
                        id="v-company-name"
                        placeholder="輸入公司名稱或品牌名稱"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
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
                        placeholder="簡短介紹公司業務、文化及招聘方向（建議 50–200 字）"
                        value={companyIntro}
                        onChange={(e) => setCompanyIntro(e.target.value)}
                        className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none transition-[color,box-shadow]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="v-br-name">業務 / 法團所用名稱</Label>
                      <Input
                        id="v-br-name"
                        placeholder="輸入商業登記證上的正式名稱"
                        value={brLegalName}
                        onChange={(e) => setBrLegalName(e.target.value)}
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
                        onClick={() => setEmployeeCount(opt.value)}
                        className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          employeeCount === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
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
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="v-contact-title">職位</Label>
                        <Input
                          id="v-contact-title"
                          placeholder="例：HR Manager"
                          value={contactTitle}
                          onChange={(e) => setContactTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="v-contact-email">電郵地址</Label>
                        <Input
                          id="v-contact-email"
                          type="email"
                          placeholder="your@company.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="v-contact-phone">聯絡電話</Label>
                        <Input
                          id="v-contact-phone"
                          type="tel"
                          placeholder="+852 xxxx xxxx"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="v-address">公司地址</Label>
                      <Input
                        id="v-address"
                        placeholder="例：香港九龍觀塘道 xxx 號 xx 樓"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="px-7 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            {formSubmitted ? (
              <Button onClick={handleCloseAfterSubmit} className="bg-blue-600 hover:bg-blue-700 px-8">
                關閉
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowVerificationForm(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmitVerification}
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  提交認證
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
