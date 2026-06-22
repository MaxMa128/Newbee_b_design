import { useState } from "react";
import {
  Plus, Pencil, X, ChevronDown, Users, UserCheck,
  Phone, Store, AlertTriangle, ClipboardCheck,
  LogOut, CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

interface ActiveEmployee {
  id: string; appId: string; name: string; gender: "男" | "女"; age: number; phone: string;
  jobTitle: string; level: string; store: string;
  hiringType: "全職" | "兼職" | "臨時工";
  startDate: string; rateType: "月薪" | "時薪"; rate: number; note: string;
}

interface PendingEmployee {
  id: string; appId: string; name: string; gender: "男" | "女"; age: number; phone: string;
  jobTitle: string; store: string; hiringType: "全職" | "兼職" | "臨時工";
  acceptedAt: string; scheduledStart?: string; scheduledEnd?: string; workDays?: string[];
}

const STORES = ["旺角分店","中環分店","中環總部","葵涌倉庫","尖沙咀分店","觀塘辦公室","銅鑼灣分店","沙田分店"];
const JOB_TYPES = ["收銀員","侍應生","客服代表","推廣員","倉務員","清潔員"];
const LEVELS = ["初級","中級","高級","主管","管理層"];
const WD: Record<string,string> = { mon:"週一",tue:"週二",wed:"週三",thu:"週四",fri:"週五",sat:"週六",sun:"週日" };

const HIRING_COLORS: Record<string, string> = {
  "全職": "bg-blue-50 text-blue-700 border-blue-200",
  "兼職": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-700 border-violet-200",
};

const AVATAR_COLORS = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-rose-100 text-rose-700","bg-amber-100 text-amber-700","bg-cyan-100 text-cyan-700"];
function ac(id: string) { return AVATAR_COLORS[parseInt(id.replace(/\D/g,"").slice(-2)||"0",10) % AVATAR_COLORS.length]; }

const INIT_ACTIVE: ActiveEmployee[] = [
  { id:"EMP-001", appId:"APP-001", name:"陳大文",  gender:"男", age:28, phone:"+852 9123 4567", jobTitle:"收銀員",   level:"初級", store:"旺角分店",   hiringType:"兼職",  startDate:"2026-06-10", rateType:"時薪", rate:65,    note:"" },
  { id:"EMP-002", appId:"APP-007", name:"黃曉恩",  gender:"女", age:24, phone:"+852 5789 0123", jobTitle:"侍應生",   level:"初級", store:"中環分店",   hiringType:"臨時工", startDate:"2026-06-08", rateType:"時薪", rate:70,    note:"" },
  { id:"EMP-003", appId:"APP-008", name:"林嘉慧",  gender:"女", age:27, phone:"+852 9890 1234", jobTitle:"侍應生",   level:"初級", store:"中環分店",   hiringType:"臨時工", startDate:"2026-06-08", rateType:"時薪", rate:70,    note:"" },
  { id:"EMP-004", appId:"APP-017", name:"劉嘉穎",  gender:"女", age:29, phone:"+852 5789 0125", jobTitle:"客服代表", level:"中級", store:"中環總部",   hiringType:"全職",  startDate:"2026-05-01", rateType:"月薪", rate:18000, note:"優秀員工，工作態度積極" },
  { id:"EMP-005", appId:"APP-012", name:"蔡敏儀",  gender:"女", age:25, phone:"+852 6234 5670", jobTitle:"推廣員",   level:"初級", store:"尖沙咀分店", hiringType:"臨時工", startDate:"2026-07-01", rateType:"時薪", rate:65,    note:"" },
  { id:"EMP-006", appId:"APP-013", name:"許志安",  gender:"男", age:30, phone:"+852 9345 6781", jobTitle:"推廣員",   level:"初級", store:"尖沙咀分店", hiringType:"臨時工", startDate:"2026-07-01", rateType:"時薪", rate:65,    note:"" },
];

const INIT_PENDING: PendingEmployee[] = [
  { id:"PEND-001", appId:"APP-003", name:"張美儀", gender:"女", age:26, phone:"+852 5345 6789", jobTitle:"收銀員", store:"旺角分店",   hiringType:"兼職",   acceptedAt:"2026-06-12", scheduledStart:"09:00", scheduledEnd:"18:00", workDays:["mon","tue","wed","thu","fri"] },
  { id:"PEND-002", appId:"APP-009", name:"梁志偉", gender:"男", age:21, phone:"+852 6901 2345", jobTitle:"侍應生", store:"中環分店",   hiringType:"臨時工", acceptedAt:"2026-06-14", scheduledStart:"17:00", scheduledEnd:"23:00", workDays:["fri","sat","sun"] },
  { id:"PEND-003", appId:"APP-004", name:"王志豪", gender:"男", age:31, phone:"+852 9456 7890", jobTitle:"收銀員", store:"旺角分店",   hiringType:"兼職",   acceptedAt:"2026-06-15", scheduledStart:"09:00", scheduledEnd:"18:00", workDays:["mon","wed","fri"] },
];

// ── Edit dialog ────────────────────────────────────────────
function EditDialog({ emp, onClose, onSave }: { emp: ActiveEmployee; onClose: () => void; onSave: (u: Partial<ActiveEmployee>) => void }) {
  const [store, setStore]       = useState(emp.store);
  const [jobTitle, setJobTitle] = useState(emp.jobTitle);
  const [level, setLevel]       = useState(emp.level);
  const [rateType, setRateType] = useState<"月薪"|"時薪">(emp.rateType);
  const [rate, setRate]         = useState(emp.rate.toString());
  const [note, setNote]         = useState(emp.note);
  const cls = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">修改員工資料</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">{emp.name} · {emp.hiringType}</DialogDescription>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">所屬門店</label>
            <div className="relative">
              <select value={store} onChange={e => setStore(e.target.value)} className={`${cls} appearance-none cursor-pointer pr-8`}>
                {STORES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">工種</label>
              <div className="relative">
                <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} className={`${cls} appearance-none cursor-pointer pr-8`}>
                  {JOB_TYPES.map(j => <option key={j}>{j}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">職級</label>
              <div className="relative">
                <select value={level} onChange={e => setLevel(e.target.value)} className={`${cls} appearance-none cursor-pointer pr-8`}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">薪酬</label>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(["時薪","月薪"] as const).map(rt => (
                  <button key={rt} type="button" onClick={() => setRateType(rt)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${rateType === rt ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{rt}</button>
                ))}
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-sm text-slate-400">HK$</span>
                <input type="number" min={0} value={rate} onChange={e => setRate(e.target.value)} className={`${cls} pl-10`} />
              </div>
              <span className="text-xs text-slate-400 shrink-0">{rateType === "時薪" ? "/ 小時" : "/ 月"}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">備注</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="員工備注（選填）" className={`${cls} resize-none`} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { onSave({ store, jobTitle, level, rateType, rate: +rate || emp.rate, note }); onClose(); }}>
            儲存修改
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Offboarding dialog ─────────────────────────────────────
function OffboardDialog({ emp, onClose, onConfirm }: { emp: ActiveEmployee; onClose: () => void; onConfirm: (date: string, eval_: string) => void }) {
  const [date, setDate]     = useState(new Date().toISOString().slice(0,10));
  const [eval_, setEval]    = useState("");
  const ok = date && eval_.trim().length >= 5;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">辦理離職</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">{emp.name} · {emp.jobTitle} · {emp.store}</DialogDescription>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">辦理離職後員工將從在職名單移除。工作評價將自動同步至「工作記錄」留存。</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">離職日期 <span className="text-red-500">*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">工作評價 <span className="text-red-500">*</span> <span className="font-normal text-slate-400">（將留存工作記錄，至少5字）</span></label>
            <textarea rows={4} value={eval_} onChange={e => setEval(e.target.value)} placeholder="請填寫此員工的工作態度、能力表現等…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={!ok}
            onClick={() => { onConfirm(date, eval_); onClose(); }}>
            <LogOut className="w-4 h-4 mr-1.5" />確認辦理離職
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject dialog ──────────────────────────────────────────
const REJECT_REASONS = [
  { value: "position_change", label: "崗位或平台變動" },
  { value: "candidate_change", label: "候選人工作變動" },
];

function RejectDialog({ emp, onClose, onConfirm }: {
  emp: PendingEmployee;
  onClose: () => void;
  onConfirm: (reason: string, detail: string) => void;
}) {
  const [reason, setReason]   = useState(REJECT_REASONS[0].value);
  const [detail, setDetail]   = useState("");
  const canConfirm = detail.trim().length >= 3;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">駁回錄用</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">{emp.name} · {emp.jobTitle} · {emp.store}</DialogDescription>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">駁回後此人員將從待入職名單移除，駁回記錄將同步至工作記錄留存。</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">駁回原因 <span className="text-red-500">*</span></label>
            {REJECT_REASONS.map(r => (
              <label key={r.value} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${reason === r.value ? "bg-red-50 border-red-300" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" checked={reason === r.value} onChange={() => setReason(r.value)} className="w-4 h-4 accent-red-600 shrink-0" />
                <span className={`text-sm font-medium ${reason === r.value ? "text-red-700" : "text-slate-700"}`}>{r.label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">駁回說明 <span className="text-red-500">*</span></label>
            <textarea rows={3} value={detail} onChange={e => setDetail(e.target.value)}
              placeholder="請說明具體駁回原因…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={!canConfirm}
            onClick={() => { onConfirm(reason, detail); onClose(); }}>
            <XCircle className="w-4 h-4 mr-1.5" />確認駁回錄用
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Onboarding dialog ──────────────────────────────────────
const ALL_WEEKDAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"] as const;

function OnboardDialog({ emp, onClose, onConfirm }: {
  emp: PendingEmployee;
  onClose: () => void;
  onConfirm: (startDate: string, scheduleOption: "auto" | "custom" | "none", customDays?: string[], customStart?: string, customEnd?: string) => void;
}) {
  const [startDate, setStartDate]   = useState(new Date().toISOString().slice(0,10));
  const [option, setOption]         = useState<"auto" | "custom" | "none">("auto");
  // Custom schedule state — pre-filled from job info
  const [customDays, setCustomDays] = useState<string[]>(emp.workDays ?? []);
  const [customStart, setCustomStart] = useState(emp.scheduledStart ?? "09:00");
  const [customEnd, setCustomEnd]   = useState(emp.scheduledEnd ?? "18:00");
  const [confirmed, setConfirmed]   = useState(false);

  const daysLabel = emp.workDays?.map(d => WD[d]).join("、") ?? "—";
  const toggleDay = (d: string) => setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const canConfirm = option === "none"
    ? true
    : option === "auto"
      ? confirmed
      : (customDays.length > 0 && customStart && customEnd && confirmed);

  const inputCls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">辦理入職</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">{emp.name} · {emp.jobTitle} · {emp.store}</DialogDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Employee card */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 ${ac(emp.appId)}`}>{emp.name[0]}</div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{emp.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{emp.phone}</span>
                <span className={`inline-flex px-1.5 py-0 rounded text-[10px] font-medium border ${HIRING_COLORS[emp.hiringType]}`}>{emp.hiringType}</span>
              </div>
            </div>
          </div>

          {/* Job schedule reference */}
          {emp.scheduledStart && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
              <div className="text-xs font-semibold text-blue-800 mb-1.5 flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5" />應聘職位排班參考</div>
              <div className="text-xs text-blue-700">{daysLabel} · {emp.scheduledStart}–{emp.scheduledEnd}</div>
            </div>
          )}

          {/* Start date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">入職日期 <span className="text-red-500">*</span></label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`w-full ${inputCls} pl-9`} />
            </div>
          </div>

          {/* Schedule option */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">入職後排班安排 <span className="text-red-500">*</span></label>
            {[
              { val: "auto"   as const, label: "按應聘排班直接確認", sub: emp.scheduledStart ? `${daysLabel} · ${emp.scheduledStart}–${emp.scheduledEnd}` : "（無應聘排班資訊）", disabled: !emp.scheduledStart },
              { val: "custom" as const, label: "手動修改排班後確認", sub: "可調整工作日及時段" },
              { val: "none"   as const, label: "稍後在排班管理手動設定", sub: "入職後前往「考勤排班 → 排班管理」設定" },
            ].map(opt => (
              <label key={opt.val} className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${option === opt.val ? "bg-blue-50 border-blue-300" : "bg-white border-slate-200 hover:border-slate-300"} ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
                <input type="radio" checked={option === opt.val} disabled={opt.disabled} onChange={() => { if (!opt.disabled) { setOption(opt.val); setConfirmed(false); } }} className="w-4 h-4 accent-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-800">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Custom schedule editor */}
          {option === "custom" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-700">自訂排班</div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-slate-600">工作日</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_WEEKDAY_KEYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${customDays.includes(d) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                      {WD[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">上班時間</div>
                  <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)} className={`w-full ${inputCls}`} />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">下班時間</div>
                  <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className={`w-full ${inputCls}`} />
                </div>
              </div>
              {customDays.length === 0 && <p className="text-xs text-amber-600">請至少選擇一個工作日</p>}
            </div>
          )}

          {/* Confirmation checkbox for auto/custom */}
          {(option === "auto" || option === "custom") && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 accent-blue-600 rounded mt-0.5 shrink-0" />
              <span className="text-xs text-slate-700">
                {option === "auto" ? "確認以上排班時間，入職後同步至排班管理" : "確認自訂排班時間，入職後同步至排班管理"}
              </span>
            </label>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={!canConfirm}
            onClick={() => {
              onConfirm(startDate, option, option === "custom" ? customDays : undefined, option === "custom" ? customStart : undefined, option === "custom" ? customEnd : undefined);
              onClose();
            }}>
            <UserCheck className="w-4 h-4 mr-1.5" />確認辦理入職
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ───────────────────────────────────────────────────
export function EmployeesPage() {
  const [tab, setTab]               = useState<"active"|"pending">("active");
  const [employees, setEmployees]   = useState<ActiveEmployee[]>(INIT_ACTIVE);
  const [pending, setPending]       = useState<PendingEmployee[]>(INIT_PENDING);
  const [editTarget, setEditTarget] = useState<ActiveEmployee | null>(null);
  const [offTarget, setOffTarget]   = useState<ActiveEmployee | null>(null);
  const [onTarget, setOnTarget]       = useState<PendingEmployee | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingEmployee | null>(null);
  const [search, setSearch]           = useState("");
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const filtActive  = employees.filter(e => !search || e.name.includes(search) || e.jobTitle.includes(search));
  const filtPending = pending.filter(e => !search || e.name.includes(search) || e.jobTitle.includes(search));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div><h1 className="text-xl font-semibold text-slate-900">雇員管理</h1><p className="text-sm text-slate-500 mt-0.5">管理在職員工及待入職人員</p></div>
            <NotificationDropdown />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label:"在職員工", value:`${employees.length} 人`, color:"bg-green-50 border-green-200 text-green-800" },
              { label:"待入職",   value:`${pending.length} 人`,   color: pending.length > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-white border-slate-200 text-slate-900" },
              { label:"本月新入職",value:`${employees.filter(e=>e.startDate.startsWith("2026-06")).length} 人`, color:"bg-blue-50 border-blue-200 text-blue-800" },
            ].map(c => (
              <div key={c.label} className={`rounded-xl p-4 border ${c.color}`}>
                <div className="text-2xl font-semibold">{c.value}</div>
                <div className="text-sm mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
            {([["active","在職人員",employees.length],["pending","已錄取待入職",pending.length]] as const).map(([key,label,count]) => (
              <button key={key} onClick={() => { setTab(key); setSearch(""); }}
                className={`px-4 py-2.5 text-sm font-medium relative transition-colors ${tab === key ? "text-blue-700" : "text-slate-500 hover:text-slate-700"}`}>
                {label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-blue-100 text-blue-700" : count > 0 && key === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="relative max-w-xs">
              <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋姓名或職位…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>

          {tab === "active" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm" style={{ minWidth: "900px" }}>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-[140px]">員工</th>
                    <th className="px-4 py-3 text-left w-[130px]">聯絡電話</th>
                    <th className="px-4 py-3 text-left w-[110px]">工種 / 職級</th>
                    <th className="px-4 py-3 text-left w-[90px]">類型</th>
                    <th className="px-4 py-3 text-left w-[110px]">所屬門店</th>
                    <th className="px-4 py-3 text-left w-[90px]">入職日期</th>
                    <th className="px-4 py-3 text-right w-[110px]">薪酬</th>
                    <th className="px-4 py-3 text-left w-[120px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtActive.length === 0 ? (
                    <tr><td colSpan={8} className="py-14 text-center text-sm text-slate-400">暫無在職員工</td></tr>
                  ) : filtActive.map(e => (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${ac(e.appId)}`}>{e.name[0]}</div>
                          <div>
                            <div className="font-medium text-slate-900">{e.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{e.gender} · {e.age} 歲</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 tabular-nums text-xs">{e.phone}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm text-slate-800 font-medium">{e.jobTitle}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{e.level}</div>
                      </td>
                      <td className="px-4 py-3.5"><span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${HIRING_COLORS[e.hiringType]}`}>{e.hiringType}</span></td>
                      <td className="px-4 py-3.5"><div className="text-sm text-slate-700 flex items-center gap-1"><Store className="w-3 h-3 text-slate-400" />{e.store}</div></td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 tabular-nums">{e.startDate}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="text-sm font-semibold text-slate-900 tabular-nums">HK$ {e.rate.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">{e.rateType}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setEditTarget(e)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"><Pencil className="w-3 h-3" />修改</button>
                          <button onClick={() => setOffTarget(e)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"><LogOut className="w-3 h-3" />離職</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "pending" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm" style={{ minWidth: "760px" }}>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-[140px]">員工</th>
                    <th className="px-4 py-3 text-left w-[130px]">聯絡電話</th>
                    <th className="px-4 py-3 text-left w-[120px]">應聘職位</th>
                    <th className="px-4 py-3 text-left w-[110px]">所屬門店</th>
                    <th className="px-4 py-3 text-left w-[170px]">應聘排班</th>
                    <th className="px-4 py-3 text-left w-[100px]">錄取時間</th>
                    <th className="px-4 py-3 text-left w-[100px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtPending.length === 0 ? (
                    <tr><td colSpan={7} className="py-14 text-center text-sm text-slate-400">暫無待入職人員</td></tr>
                  ) : filtPending.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${ac(p.appId)}`}>{p.name[0]}</div>
                          <div><div className="font-medium text-slate-900">{p.name}</div><div className="text-xs text-slate-400 mt-0.5">{p.gender} · {p.age} 歲</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 tabular-nums text-xs">{p.phone}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm text-slate-800 font-medium">{p.jobTitle}</div>
                        <span className={`inline-flex px-1.5 py-0 rounded text-[10px] font-medium border mt-0.5 ${HIRING_COLORS[p.hiringType]}`}>{p.hiringType}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{p.store}</td>
                      <td className="px-4 py-3.5">
                        {p.scheduledStart ? (
                          <div className="text-xs text-slate-600">
                            <div className="flex items-center gap-1"><ClipboardCheck className="w-3 h-3 text-blue-500" />{p.scheduledStart}–{p.scheduledEnd}</div>
                            <div className="text-slate-400 mt-0.5">{p.workDays?.map(d => WD[d]).join(" ")}</div>
                          </div>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 tabular-nums">{p.acceptedAt}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setOnTarget(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                            <UserCheck className="w-3 h-3" />辦理入職
                          </button>
                          <button onClick={() => setRejectTarget(p)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                            <XCircle className="w-3 h-3" />駁回
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {editTarget && <EditDialog emp={editTarget} onClose={() => setEditTarget(null)} onSave={u => { setEmployees(prev => prev.map(e => e.id === editTarget.id ? { ...e, ...u } : e)); setEditTarget(null); showToast("員工資料已更新"); }} />}
      {offTarget  && <OffboardDialog emp={offTarget} onClose={() => setOffTarget(null)} onConfirm={(date, eval_) => { setEmployees(prev => prev.filter(e => e.id !== offTarget.id)); setOffTarget(null); showToast("離職辦理完成，評價已同步至工作記錄"); }} />}
      {onTarget && <OnboardDialog emp={onTarget} onClose={() => setOnTarget(null)} onConfirm={(startDate, schedOpt) => {
        const e = onTarget;
        setEmployees(prev => [...prev, { id:`EMP-${String(prev.length+1).padStart(3,"0")}`, appId:e.appId, name:e.name, gender:e.gender, age:e.age, phone:e.phone, jobTitle:e.jobTitle, level:"初級", store:e.store, hiringType:e.hiringType, startDate, rateType:"時薪", rate:65, note:"" }]);
        setPending(prev => prev.filter(x => x.id !== onTarget.id));
        setOnTarget(null);
        showToast(schedOpt === "none" ? "入職辦理完成，請前往排班管理設定排班" : "入職辦理完成，排班已確認並同步");
      }} />}
      {rejectTarget && <RejectDialog emp={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={(reason, detail) => {
        setPending(prev => prev.filter(x => x.id !== rejectTarget.id));
        setRejectTarget(null);
        const reasonLabel = REJECT_REASONS.find(r => r.value === reason)?.label ?? reason;
        showToast(`已駁回 ${rejectTarget.name} 的錄用（${reasonLabel}）`);
      }} />}

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border border-green-200 bg-green-50 text-green-800 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />{toast}
          <button onClick={() => setToast(null)} className="ml-2 text-green-600 hover:text-green-800"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
