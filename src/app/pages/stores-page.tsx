import { useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Briefcase, Users, Store, Building2,
  Plus, MapPin, Phone, Pencil, X, Search, ChevronRight,
  Trash2, AlertTriangle, CheckCircle2, Send, MessageSquare,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications } from "../contexts/notification-context";

// ── Types ──────────────────────────────────────────────────
interface StoreRecord {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  manager: string;
  activeJobs: number;
}

// ── Mock data ──────────────────────────────────────────────
const INITIAL_STORES: StoreRecord[] = [
  { id: "STR-001", name: "旺角分店",   district: "旺角",   address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓",   phone: "+852 2345 6789", manager: "陳小姐",  activeJobs: 2 },
  { id: "STR-002", name: "葵涌倉庫",   district: "葵涌",   address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉",         phone: "+852 2456 7890", manager: "李先生",  activeJobs: 1 },
  { id: "STR-003", name: "中環分店",   district: "中環",   address: "香港中環皇后大道中 30 號娛樂行 G 樓",           phone: "+852 2567 8901", manager: "張經理",  activeJobs: 3 },
  { id: "STR-004", name: "尖沙咀分店", district: "尖沙咀", address: "香港九龍尖沙咀廣東道 17 號海港城",               phone: "+852 2678 9012", manager: "王主任",  activeJobs: 0 },
  { id: "STR-005", name: "觀塘辦公室", district: "觀塘",   address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓",         phone: "+852 2789 0123", manager: "劉副理",  activeJobs: 1 },
  { id: "STR-006", name: "中環總部",   district: "中環",   address: "香港中環皇后大道中 15 號 20 樓",                 phone: "+852 2890 1234", manager: "黃總監",  activeJobs: 2 },
];

const HK_DISTRICTS = [
  "中環", "灣仔", "銅鑼灣", "北角", "旺角", "油麻地", "尖沙咀",
  "深水埗", "長沙灣", "葵涌", "觀塘", "將軍澳", "荃灣", "屯門",
  "元朗", "沙田", "大埔", "上水", "西貢", "離島", "其他",
];

// ── Map Picker Modal ───────────────────────────────────────
function MapPickerModal({ open, address, onConfirm, onClose }: {
  open: boolean; address: string;
  onConfirm: (addr: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState(address);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-semibold text-slate-900">選擇門店地址</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋地址或地標"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0">搜尋</Button>
          </div>
        </div>
        {/* Fake map */}
        <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-slate-200 relative bg-[#e8eaed]" style={{ height: 240 }}>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e8eaed" />
            {[40, 90, 140, 190].map(y => <rect key={y} x="0" y={y} width="100%" height="10" fill="#d4d6d9" />)}
            {[80, 160, 240, 320, 400].map(x => <rect key={x} x={x} y="0" width="10" height="100%" fill="#d4d6d9" />)}
            {[
              [10,10,62,24],[92,10,62,24],[172,10,60,24],[244,10,70,24],[326,10,66,24],
              [10,54,62,30],[92,54,62,30],[172,54,60,30],[244,54,70,30],[326,54,66,30],
              [10,104,62,28],[92,104,62,28],[172,104,60,28],[244,104,70,28],[326,104,66,28],
              [10,154,62,28],[92,154,62,28],[172,154,60,28],[244,154,70,28],[326,154,66,28],
            ].map(([x,y,w,h],i) => <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="#cdd0d5" />)}
          </svg>
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
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-[10px] text-slate-500 px-2 py-1 rounded-md">
            示意圖，實際接入地圖 API 後可互動
          </div>
        </div>
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

// ── Store Form Modal ───────────────────────────────────────
type PhoneVerifyState = "idle" | "sent" | "verified" | "error";

function StoreFormModal({
  store,
  onClose,
  onSave,
}: {
  store: Partial<StoreRecord> | null;
  onClose: () => void;
  onSave: (s: StoreRecord) => void;
}) {
  const isNew       = !store?.id;
  const originalPhone = store?.phone ?? "";

  const [name,     setName]     = useState(store?.name     ?? "");
  const [district, setDistrict] = useState(store?.district ?? "");
  const [address,  setAddress]  = useState(store?.address  ?? "");
  const [phone,    setPhone]    = useState(originalPhone);
  const [manager,  setManager]  = useState(store?.manager  ?? "");
  const [showMap,  setShowMap]  = useState(false);

  // Phone verification
  const phoneChanged       = phone.trim() !== originalPhone.trim();
  const needsVerify        = phone.trim() !== "" && (isNew || phoneChanged);
  const [otp,        setOtp]        = useState("");
  const [verifyState, setVerifyState] = useState<PhoneVerifyState>(
    !isNew && !phoneChanged ? "verified" : "idle"
  );
  const [otpError, setOtpError] = useState("");

  const handleSendOtp = () => {
    setVerifyState("sent");
    setOtp("");
    setOtpError("");
  };
  const handleVerifyOtp = () => {
    if (otp === "1234") {           // mock: any 4-digit code works in demo
      setVerifyState("verified");
      setOtpError("");
    } else {
      setOtpError("驗證碼有誤，請重新輸入");
    }
  };
  const handlePhoneChange = (v: string) => {
    setPhone(v);
    setVerifyState("idle");
    setOtp("");
    setOtpError("");
  };

  const canSave =
    name.trim() &&
    district &&
    address.trim() &&
    (!needsVerify || verifyState === "verified");

  const inputCls = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";

  const handleSave = () => {
    onSave({
      id:         store?.id ?? `STR-${Date.now()}`,
      name, district, address, phone, manager,
      activeJobs: store?.activeJobs ?? 0,
    });
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-0 gap-0 flex flex-col" style={{ maxHeight: "90vh" }}>
          <div className="px-6 py-5 border-b border-slate-200 shrink-0 pr-14">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {isNew ? "新增門店" : "編輯門店"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-0.5">
              填寫門店基本資料及工作地點
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>門店名稱 <span className="text-red-500">*</span></Label>
                <input className={inputCls} placeholder="例：旺角分店" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>所在地區 <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none pr-8`}
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                  >
                    <option value="">請選擇地區</option>
                    {HK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-2.5 top-3 w-4 h-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>詳細地址 <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder="例：香港九龍旺角彌敦道 xxx 號 x 樓"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5 border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  onClick={() => setShowMap(true)}
                >
                  <MapPin className="w-4 h-4" />地圖
                </Button>
              </div>
              {address && (
                <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />{address}
                </div>
              )}
            </div>

            {/* Manager name */}
            <div className="space-y-1.5">
              <Label>負責人 / 店長</Label>
              <input className={inputCls} placeholder="例：陳小姐" value={manager} onChange={e => setManager(e.target.value)} />
            </div>

            {/* Manager phone + verification */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                負責人電話
                {verifyState === "verified" && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />已驗證
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <input
                  className={`${inputCls} ${verifyState === "verified" ? "border-green-300 bg-green-50/40" : ""}`}
                  placeholder="+852 xxxx xxxx"
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  disabled={verifyState === "sent"}
                />
                {needsVerify && verifyState !== "verified" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                    disabled={!phone.trim() || verifyState === "sent"}
                    onClick={handleSendOtp}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {verifyState === "sent" ? "已發送" : "發送驗證碼"}
                  </Button>
                )}
              </div>

              {/* OTP input row */}
              {verifyState === "sent" && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2.5">
                  <div className="text-xs text-blue-700">
                    驗證碼已發送至 <span className="font-semibold">{phone}</span>，請於 5 分鐘內輸入。
                    <span className="text-slate-400 ml-1">（演示：輸入 1234）</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 h-9 rounded-lg border border-blue-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.3em] font-mono"
                      placeholder="4 位驗證碼"
                      maxLength={4}
                      value={otp}
                      onChange={e => { setOtp(e.target.value); setOtpError(""); }}
                    />
                    <Button
                      type="button"
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={otp.length < 4}
                      onClick={handleVerifyOtp}
                    >
                      確認驗證
                    </Button>
                  </div>
                  {otpError && <div className="text-xs text-red-600">{otpError}</div>}
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    重新發送
                  </button>
                </div>
              )}

              {needsVerify && verifyState === "idle" && phone.trim() && (
                <div className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  請發送驗證碼以確認負責人電話號碼
                </div>
              )}
            </div>

          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button
              disabled={!canSave}
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
            >
              {isNew ? "新增門店" : "儲存修改"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MapPickerModal
        open={showMap}
        address={address}
        onConfirm={setAddress}
        onClose={() => setShowMap(false)}
      />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function StoresPage() {
  const navigate = useNavigate();
  const { unreadTalentCount, unreadCount } = useNotifications();

  const [stores, setStores]         = useState<StoreRecord[]>(INITIAL_STORES);
  const [search, setSearch]         = useState("");
  const [formTarget, setFormTarget] = useState<Partial<StoreRecord> | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<StoreRecord | null>(null);

  const filtered = stores.filter(s =>
    !search || s.name.includes(search) || s.district.includes(search) || s.address.includes(search)
  );

  const handleSave = (updated: StoreRecord) => {
    setStores(prev => {
      const exists = prev.some(s => s.id === updated.id);
      return exists ? prev.map(s => s.id === updated.id ? updated : s) : [...prev, updated];
    });
    setFormTarget(undefined);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setStores(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

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
                  item.key === "stores" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">門店管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理旗下所有門店資料及地址</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <Button
                onClick={() => setFormTarget({})}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Plus className="w-4 h-4" />新增門店
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {/* Search */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋門店名稱、地區或地址…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-sm text-slate-500">共 {stores.length} 間門店</div>
          </div>

          {/* Store cards grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Store className="w-10 h-10 text-slate-300 mb-3" />
              <div className="text-sm">暫無符合條件的門店</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(store => (
                <div
                  key={store.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{store.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">{store.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFormTarget(store)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編輯"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(store)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 text-xs">{store.district} · </span>
                        <span className="text-slate-700">{store.address}</span>
                      </div>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{store.phone}</span>
                      </div>
                    )}
                    {store.manager && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-slate-600 font-bold">{store.manager[0]}</span>
                        </div>
                        <span className="text-slate-600">負責人：{store.manager}</span>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      活躍職位：
                      <span className={`font-semibold ml-0.5 ${store.activeJobs > 0 ? "text-blue-600" : "text-slate-400"}`}>
                        {store.activeJobs}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/jobs?store=${encodeURIComponent(store.name)}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-0.5"
                    >
                      查看職位<ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Store form modal */}
      {formTarget !== undefined && (
        <StoreFormModal
          store={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-2">
              確認刪除門店？
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              即將刪除「<span className="font-medium text-slate-700">{deleteTarget?.name}</span>」，此操作無法復原。
              {deleteTarget && deleteTarget.activeJobs > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠ 該門店下有 {deleteTarget.activeJobs} 個活躍職位，刪除後相關職位將一併下架。
                </span>
              )}
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>確認刪除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
