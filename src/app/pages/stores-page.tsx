import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Store, Plus, MapPin, Pencil, X, Search, ChevronRight,
  Trash2, AlertTriangle, ImageIcon, Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Sidebar } from "../components/Sidebar";
import { useNotifications } from "../contexts/notification-context";

// ── Types ──────────────────────────────────────────────────
interface StoreRecord {
  id: string;
  name: string;
  district: string;
  address: string;
  activeJobs: number;
  photoUrl?: string;
}

// ── Mock data ──────────────────────────────────────────────
const INITIAL_STORES: StoreRecord[] = [
  { id: "STR-001", name: "旺角分店",   district: "旺角",   address: "香港九龍旺角彌敦道 608 號總統商業大廈 3 樓",   activeJobs: 2 },
  { id: "STR-002", name: "葵涌倉庫",   district: "葵涌",   address: "香港新界葵涌葵昌路 26 號貨運中心 B 倉",         activeJobs: 1 },
  { id: "STR-003", name: "中環分店",   district: "中環",   address: "香港中環皇后大道中 30 號娛樂行 G 樓",           activeJobs: 3 },
  { id: "STR-004", name: "尖沙咀分店", district: "尖沙咀", address: "香港九龍尖沙咀廣東道 17 號海港城",               activeJobs: 0 },
  { id: "STR-005", name: "觀塘辦公室", district: "觀塘",   address: "香港九龍觀塘鴻圖道 78 號樂基中心 12 樓",         activeJobs: 1 },
  { id: "STR-006", name: "中環總部",   district: "中環",   address: "香港中環皇后大道中 15 號 20 樓",                 activeJobs: 2 },
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
          <div className="font-semibold text-slate-900">選擇工作网点地址</div>
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
function StoreFormModal({
  store,
  onClose,
  onSave,
}: {
  store: Partial<StoreRecord> | null;
  onClose: () => void;
  onSave: (s: StoreRecord) => void;
}) {
  const isNew = !store?.id;

  const [name,     setName]     = useState(store?.name     ?? "");
  const [district, setDistrict] = useState(store?.district ?? "");
  const [address,  setAddress]  = useState(store?.address  ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showMap,  setShowMap]  = useState(false);

  const canSave = name.trim() && district && address.trim();

  const inputCls = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";

  const photoPreview = photoFile ? URL.createObjectURL(photoFile) : null;

  const handleSave = () => {
    onSave({
      id:        store?.id ?? `STR-${Date.now()}`,
      name, district, address,
      activeJobs: store?.activeJobs ?? 0,
      photoUrl:  photoPreview ?? store?.photoUrl,
    });
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-0 gap-0 flex flex-col" style={{ maxHeight: "90vh" }}>
          <div className="px-6 py-5 border-b border-slate-200 shrink-0 pr-14">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {isNew ? "新增工作网点" : "編輯工作网点"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-0.5">
              填寫工作网点基本資料及工作地點
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>工作网点名稱 <span className="text-red-500">*</span></Label>
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

            {/* Store photo (optional) */}
            <div className="space-y-1.5">
              <Label>工作网点照片 <span className="text-slate-400 text-xs font-normal">（選填）</span></Label>
              <div
                onClick={() => document.getElementById("store-photo-input")?.click()}
                className={`relative w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                  photoPreview
                    ? "border-blue-300 bg-blue-50/30"
                    : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="工作网点照片" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPhotoFile(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-7 h-7 text-slate-400 mb-1.5" />
                    <span className="text-sm font-medium text-slate-600">點擊上傳工作网点照片</span>
                    <span className="text-xs text-slate-400 mt-0.5">PNG / JPG，建議橫向，最大 10MB</span>
                  </>
                )}
              </div>
              <input
                id="store-photo-input"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={e => e.target.files?.[0] && setPhotoFile(e.target.files[0])}
              />
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
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">工作网点管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理旗下所有工作网点資料及地址</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <Button
                onClick={() => setFormTarget({})}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Plus className="w-4 h-4" />新增工作网点
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
                placeholder="搜尋工作网点名稱、地區或地址…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-sm text-slate-500">共 {stores.length} 个工作网点</div>
          </div>

          {/* Store cards grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Store className="w-10 h-10 text-slate-300 mb-3" />
              <div className="text-sm">暫無符合條件的工作网点</div>
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
                    {store.photoUrl && (
                      <div className="mt-1 w-full h-20 rounded-lg overflow-hidden border border-slate-100">
                        <img src={store.photoUrl} alt="門店照片" className="w-full h-full object-cover" />
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
              確認刪除工作网点？
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              即將刪除「<span className="font-medium text-slate-700">{deleteTarget?.name}</span>」，此操作無法復原。
              {deleteTarget && deleteTarget.activeJobs > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠ 該工作网点下有 {deleteTarget.activeJobs} 個活躍職位，刪除後相關職位將一併下架。
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
