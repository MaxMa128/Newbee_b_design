import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Users, ArrowRightLeft, ChevronDown, X, CheckCircle2,
  AlertTriangle, Banknote, Info, FileText, CreditCard,
  Upload, Clock, ClipboardCheck, ImageIcon, ExternalLink,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

// ── Types ──────────────────────────────────────────────────
type SettlementStatus = "待結算" | "已結算";
type PaymentStatus    = "待審核" | "已批准" | "已拒絕";
type PaymentMethod    = "現金" | "FPS轉數快" | "銀行轉帳";

interface EmployeeSettlement {
  id: string;
  employeeId: string;
  name: string;
  jobTitle: string;
  hiringType: "全職" | "兼職" | "臨時工";
  store: string;
  periodLabel: string;
  rateType: "月薪" | "時薪";
  scheduledHours: number;
  actualHours: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  rate: number;
  finalWage: number;
  hasAdjustment: boolean;
  remark?: string;
  status: SettlementStatus;
  confirmedAt: string;
  settledAt?: string;
}

interface PlatformPayment {
  id: string;
  periodDesc: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  receiptUrl?: string;
  status: PaymentStatus;
  submittedAt: string;
  reviewedAt?: string;
}

interface OutstandingPeriod {
  period: string;
  amount: number;
  status: "待提交" | "審核中";
}

// ── Mock data ──────────────────────────────────────────────
const CREDIT_LIMIT = 80000;
const INITIAL_CREDIT_USED = 28500;

const MOCK_SETTLEMENTS: EmployeeSettlement[] = [
  { id: "ES-001", employeeId: "APP-001", name: "陳大文",  jobTitle: "收銀員",   hiringType: "兼職",  store: "旺角分店",   periodLabel: "2026年6月18日",  rateType: "時薪", scheduledHours: 9.0, actualHours: 9.0, scheduledStart: "09:00", scheduledEnd: "18:00", actualStart: "09:05", actualEnd: "18:02", rate: 65,    finalWage: 585,   hasAdjustment: false, status: "待結算", confirmedAt: "2026-06-18 19:10" },
  { id: "ES-002", employeeId: "APP-007", name: "黃曉恩",  jobTitle: "侍應生",   hiringType: "臨時工", store: "中環分店",   periodLabel: "2026年6月14日",  rateType: "時薪", scheduledHours: 6.0, actualHours: 6.0, scheduledStart: "17:00", scheduledEnd: "23:00", actualStart: "17:00", actualEnd: "23:00", rate: 70,    finalWage: 420,   hasAdjustment: false, status: "待結算", confirmedAt: "2026-06-15 09:00" },
  { id: "ES-003", employeeId: "APP-013", name: "許志安",  jobTitle: "推廣員",   hiringType: "臨時工", store: "尖沙咀分店", periodLabel: "2026年6月18日",  rateType: "時薪", scheduledHours: 8.0, actualHours: 7.6, scheduledStart: "10:00", scheduledEnd: "18:00", actualStart: "10:23", actualEnd: "18:00", rate: 65,    finalWage: 494,   hasAdjustment: false, status: "待結算", confirmedAt: "2026-06-18 19:30" },
  { id: "ES-004", employeeId: "APP-001", name: "陳大文",  jobTitle: "收銀員",   hiringType: "兼職",  store: "旺角分店",   periodLabel: "2026年6月17日",  rateType: "時薪", scheduledHours: 9.0, actualHours: 9.0, scheduledStart: "09:00", scheduledEnd: "18:00", actualStart: "09:00", actualEnd: "18:01", rate: 65,    finalWage: 585,   hasAdjustment: false, status: "已結算", confirmedAt: "2026-06-17 19:00", settledAt: "2026-06-17 20:00" },
  { id: "ES-005", employeeId: "APP-007", name: "黃曉恩",  jobTitle: "侍應生",   hiringType: "臨時工", store: "中環分店",   periodLabel: "2026年6月13日",  rateType: "時薪", scheduledHours: 6.0, actualHours: 6.0, scheduledStart: "17:00", scheduledEnd: "23:00", actualStart: "17:02", actualEnd: "23:00", rate: 70,    finalWage: 420,   hasAdjustment: false, status: "已結算", confirmedAt: "2026-06-14 08:00", settledAt: "2026-06-14 10:00" },
  { id: "ES-006", employeeId: "APP-017", name: "劉嘉穎",  jobTitle: "客服代表", hiringType: "全職",  store: "中環總部",   periodLabel: "2026年5月全月",  rateType: "月薪", scheduledHours: 176,  actualHours: 176,  rate: 18000, finalWage: 18000, hasAdjustment: false, status: "已結算", confirmedAt: "2026-05-31 18:00", settledAt: "2026-05-31 20:00" },
  { id: "ES-007", employeeId: "APP-012", name: "蔡敏儀",  jobTitle: "推廣員",   hiringType: "臨時工", store: "尖沙咀分店", periodLabel: "2026年6月16日",  rateType: "時薪", scheduledHours: 8.0, actualHours: 7.6, scheduledStart: "10:00", scheduledEnd: "18:00", actualStart: "10:23", actualEnd: "18:00", rate: 65,    finalWage: 520,   hasAdjustment: true,  remark: "協商後按8小時計算", status: "已結算", confirmedAt: "2026-06-16 19:00", settledAt: "2026-06-17 09:00" },
];

const OUTSTANDING_PERIODS: OutstandingPeriod[] = [
  { period: "2026年6月15日至21日", amount: 14300, status: "待提交" },
  { period: "2026年6月8日至14日",  amount: 8200,  status: "審核中" },
  { period: "2026年6月1日至7日",   amount: 6000,  status: "待提交" },
];

const INITIAL_PAYMENTS: PlatformPayment[] = [
  { id: "PLAT-001", periodDesc: "2026年5月全月",       amount: 22000, method: "銀行轉帳",  reference: "HSBC-20260601-001", status: "已批准", submittedAt: "2026-06-01 10:00", reviewedAt: "2026-06-02 09:30", note: "5月份全體員工薪酬結算" },
  { id: "PLAT-002", periodDesc: "2026年6月8日至14日",  amount: 8200,  method: "FPS轉數快", reference: "FPS-20260615-001",  status: "待審核", submittedAt: "2026-06-15 14:30", note: "6月第二週薪酬" },
];

// ── Config ─────────────────────────────────────────────────
const HIRING_COLORS: Record<EmployeeSettlement["hiringType"], string> = {
  "全職":   "bg-blue-50 text-blue-700 border-blue-200",
  "兼職":   "bg-indigo-50 text-indigo-700 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-700 border-violet-200",
};
const PAY_STATUS_CFG: Record<PaymentStatus, { color: string; dot: string }> = {
  "待審核": { color: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400 animate-pulse" },
  "已批准": { color: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  "已拒絕": { color: "bg-red-50 text-red-600 border-red-200",        dot: "bg-red-500" },
};

// ── Credit bar ─────────────────────────────────────────────
function CreditBar({ limit, used, reviewing }: { limit: number; used: number; reviewing: number }) {
  const pConfirmed = Math.min(((used - reviewing) / limit) * 100, 100);
  const pReview    = Math.min((reviewing / limit) * 100, 100 - pConfirmed);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-blue-500" />授信額度使用情況
        </div>
        <span className="text-sm text-slate-500 tabular-nums">HK$ {used.toLocaleString()} / HK$ {limit.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className="h-full flex">
          <div className="bg-blue-500 transition-all" style={{ width: `${pConfirmed}%` }} />
          <div className="bg-violet-300 transition-all" style={{ width: `${pReview}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "已佔用",   value: used - reviewing,  color: "text-blue-700" },
          { label: "審核中",   value: reviewing,         color: "text-violet-600" },
          { label: "可用額度", value: limit - used,       color: limit - used < limit * 0.2 ? "text-red-600" : "text-green-700" },
        ].map(c => (
          <div key={c.label}>
            <div className={`text-base font-semibold ${c.color} tabular-nums`}>HK$ {c.value.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settlement Confirm Dialog ──────────────────────────────
function SettlementConfirmDialog({ settlement, onClose, onConfirm }: {
  settlement: EmployeeSettlement;
  onClose: () => void;
  onConfirm: (update: { actualHours: number; rate: number; finalWage: number; hasAdjustment: boolean; remark?: string }) => void;
}) {
  const navigate = useNavigate();
  const isFullTime = settlement.hiringType === "全職";

  const [hoursStr, setHoursStr]       = useState(settlement.actualHours.toString());
  const [rateStr, setRateStr]         = useState(settlement.rate.toString());
  const [showOverride, setShowOverride] = useState(settlement.hasAdjustment);
  const [overrideStr, setOverrideStr] = useState(settlement.hasAdjustment ? settlement.finalWage.toString() : "");
  const [remark, setRemark]           = useState(settlement.remark ?? "");

  const hours      = parseFloat(hoursStr) || 0;
  const rate       = parseFloat(rateStr)  || 0;
  const calcWage   = isFullTime ? rate : Math.round(hours * rate * 100) / 100;
  const overrideW  = parseFloat(overrideStr);
  const isOverride = showOverride && overrideStr !== "" && !isNaN(overrideW) && overrideW !== calcWage;
  const finalWage  = isOverride ? overrideW : calcWage;
  const hoursDiff  = settlement.scheduledHours > 0 && hours !== settlement.scheduledHours;
  const canConfirm = rate > 0 && hours >= 0 && (!isOverride || remark.trim().length > 0);

  const cls = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">確認工時及出糧金額</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">
            {settlement.name} · {settlement.jobTitle} · {settlement.periodLabel}
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Attendance summary */}
          {settlement.scheduledStart && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />排班時間</div>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">{settlement.scheduledStart} – {settlement.scheduledEnd}</div>
                <div className="text-xs text-slate-400 mt-0.5">{settlement.scheduledHours} 小時</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />實際打卡</div>
                <div className="text-sm font-semibold text-blue-700 tabular-nums">{settlement.actualStart ?? "—"} – {settlement.actualEnd ?? "—"}</div>
                <div className="text-xs text-blue-500 mt-0.5">{settlement.actualHours} 小時</div>
                <button
                  onClick={() => navigate(`/attendance-employee?id=${settlement.employeeId}&returnTo=finance`)}
                  className="mt-2 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  查看打卡詳情<ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}

          {/* Confirmed hours */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              {isFullTime ? "本月出勤工時" : "確認工時"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input type="number" min={0} step={0.5} value={hoursStr} onChange={e => setHoursStr(e.target.value)}
                className={`${cls} pr-14`} placeholder="輸入工時" />
              <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">小時</span>
            </div>
            {hoursDiff && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />工時與打卡記錄不一致，請確認是否正確
              </div>
            )}
          </div>

          {/* Wage rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              標準{settlement.rateType} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none">HK$</span>
                <input type="number" min={0} value={rateStr} onChange={e => setRateStr(e.target.value)}
                  className={`${cls} pl-10`} placeholder={isFullTime ? "月薪金額" : "時薪金額"} />
              </div>
              <span className="text-xs text-slate-400 shrink-0">{isFullTime ? "/ 月" : "/ 小時"}</span>
            </div>
          </div>

          {/* Calculated wage */}
          {rate > 0 && hours >= 0 && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="text-sm text-green-800 flex items-center gap-1.5">
                <Banknote className="w-4 h-4" />系統計算出糧金額
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-green-800 tabular-nums">HK$ {calcWage.toLocaleString()}</div>
                {!isFullTime && <div className="text-xs text-green-600">{hours}h × HK${rate}</div>}
              </div>
            </div>
          )}

          {/* Manual override toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />手動調整最終出糧金額
            </span>
            <button type="button" onClick={() => { setShowOverride(v => !v); if (showOverride) { setOverrideStr(""); setRemark(""); } }}
              className={`w-10 h-6 rounded-full relative transition-colors ${showOverride ? "bg-blue-600" : "bg-slate-200"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showOverride ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {showOverride && (
            <div className="space-y-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />手動調整最終出糧金額
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">最終出糧金額 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-slate-400">HK$</span>
                  <input type="number" min={0} value={overrideStr} onChange={e => setOverrideStr(e.target.value)}
                    className={`${cls} pl-10 bg-white`} placeholder="輸入最終金額" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  備注 <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">（如有調整必填）</span>
                </label>
                <textarea rows={2} value={remark} onChange={e => setRemark(e.target.value)}
                  placeholder="請填寫調整原因，此記錄將留存備查…"
                  className={`${cls} resize-none bg-white`} />
              </div>
            </div>
          )}

          {/* Final wage preview */}
          {rate > 0 && (
            <div className="bg-slate-900 text-white rounded-xl px-5 py-4">
              <div className="text-xs text-slate-400 mb-1">最終出糧金額</div>
              <div className="text-2xl font-bold tabular-nums">HK$ {finalWage.toLocaleString()}</div>
              {isOverride && <div className="text-xs text-amber-300 mt-1">已手動調整 · {remark}</div>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!canConfirm}
            onClick={() => {
              onConfirm({ actualHours: hours, rate, finalWage, hasAdjustment: isOverride, remark: isOverride ? remark : undefined });
            }}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />確認出糧
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Payment submit dialog ──────────────────────────────────
function PaymentDialog({ outstanding, onClose, onSubmit }: {
  outstanding: OutstandingPeriod[];
  onClose: () => void;
  onSubmit: (p: Omit<PlatformPayment, "id" | "submittedAt" | "status">) => void;
}) {
  const pending  = outstanding.filter(p => p.status === "待提交");
  const fileRef  = useRef<HTMLInputElement>(null);
  const [selected, setSelected]       = useState<string[]>([]);
  const [method, setMethod]           = useState<PaymentMethod>("FPS轉數快");
  const [ref_, setRef_]               = useState("");
  const [note, setNote]               = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const total = pending.filter(p => selected.includes(p.period)).reduce((s, p) => s + p.amount, 0);
  const toggle = (period: string) =>
    setSelected(prev => prev.includes(period) ? prev.filter(x => x !== period) : [...prev, period]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">提交支付記錄</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">線下支付後提交記錄，由平台審核確認</DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Period selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">選擇結算週期 <span className="text-red-500">*</span></label>
            {pending.map(p => (
              <label key={p.period} className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors ${selected.includes(p.period) ? "bg-blue-50 border-blue-300" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" checked={selected.includes(p.period)} onChange={() => toggle(p.period)} className="w-4 h-4 accent-blue-600 rounded" />
                  <span className="text-sm text-slate-700">{p.period}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">HK$ {p.amount.toLocaleString()}</span>
              </label>
            ))}
            {total > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-xs font-medium text-blue-700">本次支付合計</span>
                <span className="text-base font-semibold text-blue-800 tabular-nums">HK$ {total.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">支付方式 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {(["現金","FPS轉數快","銀行轉帳"] as PaymentMethod[]).map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${method === m ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">交易參考號碼 <span className="text-slate-400 font-normal">（選填）</span></label>
            <input value={ref_} onChange={e => setRef_(e.target.value)} placeholder="FPS/銀行轉帳交易號"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Receipt image upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">上傳支付憑證 <span className="text-slate-400 font-normal">（選填）</span></label>
            {receiptPreview ? (
              <div className="relative">
                <img src={receiptPreview} alt="支付憑證" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                <button
                  onClick={() => { setReceiptPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-slate-500 hover:text-red-500 border border-slate-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">已上傳</div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors group">
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Upload className="w-4.5 h-4.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="text-xs text-slate-500">點擊上傳收據截圖或照片</span>
                  <span className="text-[10px] text-slate-400">支援 JPG、PNG、PDF</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">備注 <span className="text-slate-400 font-normal">（選填）</span></label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="如需備注可在此填寫"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">提交後記錄進入「待平台審核」狀態，審核通過後相應授信額度將自動恢復。</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={selected.length === 0}
            onClick={() => {
              onSubmit({ periodDesc: selected.join("、"), amount: total, method, reference: ref_ || undefined, note: note || undefined, receiptUrl: receiptPreview || undefined });
              onClose();
            }}>
            提交支付記錄
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Settlement detail drawer ───────────────────────────────
function SettlementDetailDrawer({ settlement, onClose }: {
  settlement: EmployeeSettlement;
  onClose: () => void;
}) {
  const isFullTime = settlement.hiringType === "全職";
  const calcWage   = isFullTime
    ? settlement.rate
    : Math.round(settlement.actualHours * settlement.rate * 100) / 100;

  const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
      <span className="text-xs text-slate-400 w-20 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-sm text-slate-800">{children}</div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />已出糧
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${HIRING_COLORS[settlement.hiringType]}`}>
                {settlement.hiringType}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{settlement.name}</h2>
            <div className="text-sm text-slate-500 mt-0.5">{settlement.jobTitle} · {settlement.store}</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Period */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">結算期間</div>
            <div className="text-sm font-medium text-slate-900">{settlement.periodLabel}</div>
          </div>

          {/* Attendance */}
          {settlement.scheduledStart && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">考勤記錄</div>
              <div className="space-y-2.5">
                <DetailRow label="排班時間">
                  <span className="tabular-nums">{settlement.scheduledStart} – {settlement.scheduledEnd}</span>
                  <span className="text-xs text-slate-400 ml-1.5">({settlement.scheduledHours} 小時)</span>
                </DetailRow>
                <DetailRow label="實際打卡">
                  <span className={`tabular-nums font-medium ${settlement.actualHours !== settlement.scheduledHours ? "text-amber-700" : "text-green-700"}`}>
                    {settlement.actualStart ?? "—"} – {settlement.actualEnd ?? "—"}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">({settlement.actualHours} 小時)</span>
                </DetailRow>
                {settlement.actualHours !== settlement.scheduledHours && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                    實際工時與排班不符，差異 {Math.abs(settlement.scheduledHours - settlement.actualHours).toFixed(1)} 小時
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wage calc */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">薪酬計算</div>
            <div className="space-y-2.5">
              <DetailRow label={settlement.rateType}>
                HK$ {settlement.rate.toLocaleString()} {isFullTime ? "/ 月" : "/ 小時"}
              </DetailRow>
              <DetailRow label="計算薪酬">
                <span className="tabular-nums">HK$ {calcWage.toLocaleString()}</span>
                {!isFullTime && <span className="text-xs text-slate-400 ml-1.5">({settlement.actualHours}h × {settlement.rate})</span>}
              </DetailRow>
              {settlement.hasAdjustment && (
                <>
                  <DetailRow label="最終薪酬">
                    <span className="font-semibold text-amber-700 tabular-nums">HK$ {settlement.finalWage.toLocaleString()}</span>
                    <span className="text-xs text-amber-600 ml-1.5">（已調整）</span>
                  </DetailRow>
                  {settlement.remark && (
                    <DetailRow label="調整備注">
                      <span className="text-slate-700 leading-relaxed">{settlement.remark}</span>
                    </DetailRow>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Final wage highlight */}
          <div className="bg-slate-900 text-white rounded-xl px-5 py-4">
            <div className="text-xs text-slate-400 mb-1">最終出糧金額</div>
            <div className="text-2xl font-bold tabular-nums">HK$ {settlement.finalWage.toLocaleString()}</div>
          </div>

          {/* Settlement time */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">操作記錄</div>
            <div className="space-y-2.5">
              <DetailRow label="工時確認">{settlement.confirmedAt}</DetailRow>
              {settlement.settledAt && <DetailRow label="出糧確認">{settlement.settledAt}</DetailRow>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Stat card ──────────────────────────────────────────────
function SC({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-sm mt-0.5">{label}</div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function FinancePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive tab from URL — this fixes the navigation bug automatically
  const tab: "employee" | "platform" = location.pathname === "/finance-platform" ? "platform" : "employee";
  const switchTab = (t: "employee" | "platform") =>
    navigate(t === "platform" ? "/finance-platform" : "/finance", { replace: true });

  const [settlements, setSettlements]   = useState<EmployeeSettlement[]>(MOCK_SETTLEMENTS);
  const [payments, setPayments]         = useState<PlatformPayment[]>(INITIAL_PAYMENTS);
  const [outstanding, setOutstanding]   = useState<OutstandingPeriod[]>(OUTSTANDING_PERIODS);
  const [creditUsed, setCreditUsed]     = useState(INITIAL_CREDIT_USED);
  const [statusFilter, setStatusFilter] = useState("all");
  const [settleTarget, setSettleTarget]     = useState<EmployeeSettlement | null>(null);
  const [detailSettlement, setDetailSettlement] = useState<EmployeeSettlement | null>(null);
  const [showPayDialog, setShowPayDialog]   = useState(false);
  const [detailPayment, setDetailPayment] = useState<PlatformPayment | null>(null);

  const reviewing     = payments.filter(p => p.status === "待審核").reduce((s, p) => s + p.amount, 0);
  const pendingWage   = settlements.filter(s => s.status === "待結算").reduce((s, x) => s + x.finalWage, 0);
  const settledWage   = settlements.filter(s => s.status === "已結算").reduce((s, x) => s + x.finalWage, 0);
  const pendingPay    = outstanding.filter(p => p.status === "待提交").reduce((s, p) => s + p.amount, 0);
  const reviewingPay  = outstanding.filter(p => p.status === "審核中").reduce((s, p) => s + p.amount, 0);
  const paidThisMonth = payments.filter(p => p.status === "已批准").reduce((s, p) => s + p.amount, 0);

  const handleConfirmSettlement = (update: { actualHours: number; rate: number; finalWage: number; hasAdjustment: boolean; remark?: string }) => {
    if (!settleTarget) return;
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    setSettlements(prev => prev.map(s => s.id === settleTarget.id
      ? { ...s, ...update, status: "已結算", settledAt: now }
      : s
    ));
    setCreditUsed(prev => prev + update.finalWage);
    setSettleTarget(null);
  };

  const handleSubmitPayment = (data: Omit<PlatformPayment, "id" | "submittedAt" | "status">) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    setPayments(prev => [{ ...data, id: `PLAT-${String(prev.length+1).padStart(3,"0")}`, status: "待審核", submittedAt: now }, ...prev]);
    setOutstanding(prev => prev.map(p => data.periodDesc.includes(p.period) ? { ...p, status: "審核中" } : p));
  };

  const filteredSettlements = settlements.filter(s => statusFilter === "all" || s.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">財務管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">管理員工薪酬結算及邦芒平台支付</p>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {/* Credit bar */}
          <div className="mb-6">
            <CreditBar limit={CREDIT_LIMIT} used={creditUsed} reviewing={reviewing} />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
            {([
              { key: "employee", label: "人員結算",  icon: <Users className="w-4 h-4" /> },
              { key: "platform", label: "平台結算",  icon: <ArrowRightLeft className="w-4 h-4" /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => switchTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium relative transition-colors ${tab === t.key ? "text-blue-700" : "text-slate-500 hover:text-slate-700"}`}>
                {t.icon}{t.label}
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
              </button>
            ))}
          </div>

          {/* ── Employee Settlement ── */}
          {tab === "employee" && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <SC label="待確認出糧筆數" value={`${settlements.filter(s=>s.status==="待結算").length} 筆`} color="bg-amber-50 border-amber-200 text-amber-800" />
                <SC label="待確認金額"     value={`HK$ ${pendingWage.toLocaleString()}`}                  color="bg-white border-slate-200 text-slate-900" />
                <SC label="本月已出糧"     value={`HK$ ${settledWage.toLocaleString()}`}                  color="bg-green-50 border-green-200 text-green-800" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm flex items-center gap-3">
                <div className="relative">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className={`h-8 pl-3 pr-7 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusFilter !== "all" ? "border-blue-400 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600"}`}>
                    <option value="all">全部狀態</option>
                    <option value="待結算">待確認出糧</option>
                    <option value="已結算">已出糧</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />在此頁面確認工時及薪酬，確認後自動計入授信佔用並生成平台應付款。
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm" style={{ minWidth: "880px" }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-[130px]">員工</th>
                      <th className="px-4 py-3 text-left w-[80px]">類型</th>
                      <th className="px-4 py-3 text-left w-[150px]">結算期間</th>
                      <th className="px-4 py-3 text-center w-[120px]">工時（排班/實際）</th>
                      <th className="px-4 py-3 text-right w-[130px]">薪酬</th>
                      <th className="px-4 py-3 text-left w-[80px]">狀態</th>
                      <th className="px-4 py-3 text-left w-[130px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSettlements.length === 0 ? (
                      <tr><td colSpan={7} className="py-14 text-center text-sm text-slate-400">暫無結算記錄</td></tr>
                    ) : filteredSettlements.map(s => (
                      <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900">{s.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{s.jobTitle} · {s.store}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${HIRING_COLORS[s.hiringType]}`}>{s.hiringType}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">{s.periodLabel}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="text-sm text-slate-700 tabular-nums">
                            {s.scheduledHours}h → <span className={s.actualHours !== s.scheduledHours ? "text-amber-600 font-semibold" : "text-green-700 font-semibold"}>{s.actualHours}h</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="text-sm font-semibold text-slate-900 tabular-nums">HK$ {s.finalWage.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{s.rateType} {s.rate.toLocaleString()}</div>
                          {s.hasAdjustment && <div className="text-[10px] text-amber-600">已調整</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${s.status === "待結算" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                            {s.status === "已結算" && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                            {s.status === "待結算" ? "待確認" : "已出糧"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {s.status === "待結算" ? (
                            <button onClick={() => setSettleTarget(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
                              <ClipboardCheck className="w-3 h-3" />確認工時及出糧
                            </button>
                          ) : (
                            <button onClick={() => setDetailSettlement(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors">
                              <FileText className="w-3 h-3" />查看詳情
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Platform Settlement ── */}
          {tab === "platform" && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <SC label="待提交支付" value={`HK$ ${pendingPay.toLocaleString()}`}     color="bg-amber-50 border-amber-200 text-amber-800" />
                <SC label="審核中金額" value={`HK$ ${reviewingPay.toLocaleString()}`}   color="bg-violet-50 border-violet-200 text-violet-800" />
                <SC label="本月已支付" value={`HK$ ${paidThisMonth.toLocaleString()}`}  color="bg-green-50 border-green-200 text-green-800" />
              </div>

              {/* Outstanding breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">應付款項明細</div>
                    <div className="text-xs text-slate-400 mt-0.5">可選擇部分週期進行結算</div>
                  </div>
                  <Button onClick={() => setShowPayDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 text-sm">
                    <Banknote className="w-4 h-4" />提交支付記錄
                  </Button>
                </div>
                <div className="space-y-2">
                  {outstanding.map(p => (
                    <div key={p.period} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${p.status === "審核中" ? "bg-violet-50 border-violet-200" : "bg-slate-50 border-slate-200"}`}>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{p.period}</div>
                        <div className={`text-xs mt-0.5 font-medium ${p.status === "審核中" ? "text-violet-600" : "text-amber-600"}`}>
                          {p.status === "審核中" ? "⏳ 支付審核中" : "⚠ 待提交支付"}
                        </div>
                      </div>
                      <div className="text-base font-semibold text-slate-900 tabular-nums">HK$ {p.amount.toLocaleString()}</div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm font-semibold text-blue-800">合計應付</div>
                    <div className="text-lg font-bold text-blue-800 tabular-nums">HK$ {outstanding.reduce((s,p)=>s+p.amount,0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Payment history */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 text-sm font-semibold text-slate-800">支付記錄</div>
                <table className="w-full text-sm" style={{ minWidth: "820px" }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-[180px]">結算週期</th>
                      <th className="px-4 py-3 text-right w-[120px]">支付金額</th>
                      <th className="px-4 py-3 text-left w-[110px]">支付方式</th>
                      <th className="px-4 py-3 text-left w-[130px]">參考號碼</th>
                      <th className="px-4 py-3 text-center w-[50px]">憑證</th>
                      <th className="px-4 py-3 text-left w-[130px]">提交時間</th>
                      <th className="px-4 py-3 text-left w-[90px]">狀態</th>
                      <th className="px-4 py-3 text-left w-[70px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const cfg = PAY_STATUS_CFG[p.status];
                      return (
                        <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 text-sm text-slate-700">{p.periodDesc}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 tabular-nums">HK$ {p.amount.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-600">{p.method}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{p.reference ?? "—"}</td>
                          <td className="px-4 py-3.5 text-center">
                            {p.receiptUrl
                              ? <img src={p.receiptUrl} alt="憑證" className="w-8 h-8 object-cover rounded border border-slate-200 inline-block cursor-pointer" />
                              : <span className="text-slate-300"><ImageIcon className="w-4 h-4 inline" /></span>
                            }
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">{p.submittedAt}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />{p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => setDetailPayment(p)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
                              <FileText className="w-3 h-3" />查看
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Settlement confirm dialog */}
      {settleTarget && (
        <SettlementConfirmDialog
          settlement={settleTarget}
          onClose={() => setSettleTarget(null)}
          onConfirm={handleConfirmSettlement}
        />
      )}

      {/* Settlement detail drawer */}
      {detailSettlement && (
        <SettlementDetailDrawer
          settlement={detailSettlement}
          onClose={() => setDetailSettlement(null)}
        />
      )}

      {/* Payment dialog */}
      {showPayDialog && (
        <PaymentDialog outstanding={outstanding} onClose={() => setShowPayDialog(false)} onSubmit={handleSubmitPayment} />
      )}

      {/* Payment detail drawer */}
      {detailPayment && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetailPayment(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${PAY_STATUS_CFG[detailPayment.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${PAY_STATUS_CFG[detailPayment.status].dot}`} />{detailPayment.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 text-sm">{detailPayment.periodDesc}</div>
              </div>
              <button onClick={() => setDetailPayment(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="text-2xl font-bold text-slate-900 tabular-nums">HK$ {detailPayment.amount.toLocaleString()}</div>
              {[["支付方式",detailPayment.method],["參考號碼",detailPayment.reference??"—"],["提交時間",detailPayment.submittedAt],["審核時間",detailPayment.reviewedAt??"—"]].map(([l,v]) => (
                <div key={l} className="flex gap-4">
                  <span className="text-xs text-slate-400 w-16 shrink-0 pt-0.5">{l}</span>
                  <span className="text-sm text-slate-800">{v}</span>
                </div>
              ))}
              {detailPayment.receiptUrl && (
                <div>
                  <div className="text-xs text-slate-400 mb-1.5">支付憑證</div>
                  <img src={detailPayment.receiptUrl} alt="支付憑證" className="w-full rounded-xl border border-slate-200 object-contain max-h-48" />
                </div>
              )}
              {detailPayment.note && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <div className="text-xs font-medium text-slate-500 mb-1">備注</div>
                  <div className="text-sm text-slate-700">{detailPayment.note}</div>
                </div>
              )}
              {detailPayment.status === "已批准" && (
                <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-green-700">支付已批准，授信額度已恢復 HK$ {detailPayment.amount.toLocaleString()}</div>
                </div>
              )}
              {detailPayment.status === "待審核" && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">正在等待平台側審核，審核通過後授信額度將恢復。</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
