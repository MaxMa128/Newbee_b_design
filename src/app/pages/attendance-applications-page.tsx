import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, MapPin,
  Phone, X, FileText, Image as ImageIcon, ChevronDown,
  ClipboardCheck, Calendar, AlertTriangle,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

type AppStatus = "待審核" | "已批准" | "已拒絕";

interface BaseApp {
  id: string; name: string; phone: string; jobTitle: string; store: string;
  submittedAt: string; reason: string; photo?: string;
  status: AppStatus; reviewedAt?: string; reviewNote?: string;
}

interface CorrectionApp extends BaseApp {
  date: string; shiftTime: string; correctionType: "上班打卡" | "下班打卡";
}

interface LeaveApp extends BaseApp {
  leaveType: "事假" | "病假" | "產假/侍產假" | "年假" | "調休" | "其他";
  startDate: string; endDate: string; totalDays: number;
}

interface OvertimeApp extends BaseApp {
  startDateTime: string; endDateTime: string; hours: number;
}

const CLOCK_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180'><rect width='240' height='180' fill='%23e2e8f0'/><rect x='0' y='135' width='240' height='45' fill='%230f172a' opacity='0.5'/><circle cx='120' cy='90' r='28' fill='%2394a3b8'/><circle cx='120' cy='75' r='16' fill='%23dde3eb'/><ellipse cx='120' cy='140' rx='45' ry='25' fill='%2394a3b8'/><text x='120' y='168' font-family='sans-serif' font-size='11' fill='%23cbd5e1' text-anchor='middle'>現場照片</text></svg>`
);

// ── Mock data ──────────────────────────────────────────────
const MOCK_CORRECTIONS: CorrectionApp[] = [
  { id: "CA-001", name: "黃曉恩", phone: "+852 5789 0123", jobTitle: "侍應生", store: "中環分店",   date: "2026-06-14", shiftTime: "17:00–23:00", correctionType: "下班打卡", reason: "收工後忙於收尾工作忘記打卡，實際完成工作時間為 23:00，有同事目擊。",                    photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-15 10:30" },
  { id: "CA-002", name: "劉嘉穎", phone: "+852 5789 0125", jobTitle: "客服代表", store: "中環總部", date: "2026-06-18", shiftTime: "09:00–18:00", correctionType: "下班打卡", reason: "因家庭緊急事務提早離開，已事先口頭告知主管並獲批准。申請補填排班下班時間 18:00。", photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-18 16:40" },
  { id: "CA-003", name: "陳大文",  phone: "+852 9123 4567", jobTitle: "收銀員",   store: "旺角分店",  date: "2026-06-16", shiftTime: "09:00–18:00", correctionType: "上班打卡", reason: "當日手機電量耗盡未能打卡，已按時到崗，由同事可作證。申請補打上班打卡。",              photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-16 09:15" },
  { id: "CA-004", name: "林嘉慧",  phone: "+852 9890 1234", jobTitle: "侍應生",   store: "中環分店",  date: "2026-06-07", shiftTime: "17:00–23:00", correctionType: "下班打卡", reason: "系統故障導致下班打卡失敗，已截圖系統報錯，實際下班時間 23:05。",                       photo: CLOCK_PHOTO, status: "已批准", submittedAt: "2026-06-08 08:00", reviewedAt: "2026-06-08 10:00", reviewNote: "核實後批准，補打下班卡。" },
];

const LEAVE_TYPES = ["事假", "病假", "產假/侍產假", "年假", "調休", "其他"] as const;

const MOCK_LEAVES: LeaveApp[] = [
  { id: "LA-001", name: "蔡敏儀",  phone: "+852 6234 5670", jobTitle: "推廣員",   store: "尖沙咀分店", leaveType: "事假",  startDate: "2026-06-20", endDate: "2026-06-20", totalDays: 1, reason: "需處理個人行政事務，預計半日即可完成，已提前安排代班。",            photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-17 14:00" },
  { id: "LA-002", name: "黃曉恩",  phone: "+852 5789 0123", jobTitle: "侍應生",   store: "中環分店",   leaveType: "病假",  startDate: "2026-06-25", endDate: "2026-06-26", totalDays: 2, reason: "上呼吸道感染，已就診並附上醫生紙。",                             photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-24 20:30" },
  { id: "LA-003", name: "劉嘉穎",  phone: "+852 5789 0125", jobTitle: "客服代表", store: "中環總部",   leaveType: "年假",  startDate: "2026-06-29", endDate: "2026-06-30", totalDays: 2, reason: "申請年假休息。",                                                 photo: undefined, status: "已批准", submittedAt: "2026-06-20 10:00", reviewedAt: "2026-06-21 09:00", reviewNote: "已批准，共2天年假。" },
];

const MOCK_OVERTIME: OvertimeApp[] = [
  { id: "OT-001", name: "陳大文",  phone: "+852 9123 4567", jobTitle: "收銀員",   store: "旺角分店",   startDateTime: "2026-06-18 18:00", endDateTime: "2026-06-18 21:00", hours: 3,   reason: "月末盤點需要額外時間完成，主管已口頭批准。",         photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-18 21:10" },
  { id: "OT-002", name: "許志安",  phone: "+852 9345 6781", jobTitle: "推廣員",   store: "尖沙咀分店", startDateTime: "2026-06-17 17:00", endDateTime: "2026-06-17 20:00", hours: 3,   reason: "臨時活動延長，配合客戶需求加班至活動結束。",         photo: CLOCK_PHOTO, status: "待審核", submittedAt: "2026-06-17 20:05" },
  { id: "OT-003", name: "劉嘉穎",  phone: "+852 5789 0125", jobTitle: "客服代表", store: "中環總部",   startDateTime: "2026-06-15 18:00", endDateTime: "2026-06-15 20:00", hours: 2,   reason: "緊急客訴跟進，需延後下班處理。",                     photo: CLOCK_PHOTO, status: "已批准", submittedAt: "2026-06-15 20:10", reviewedAt: "2026-06-16 09:00", reviewNote: "已批准加班2小時。" },
];

const STATUS_CFG: Record<AppStatus, { color: string; dot: string }> = {
  "待審核": { color: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400 animate-pulse" },
  "已批准": { color: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  "已拒絕": { color: "bg-red-50 text-red-600 border-red-200",        dot: "bg-red-500" },
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  "事假": "bg-slate-50 text-slate-600 border-slate-200",
  "病假": "bg-red-50 text-red-600 border-red-200",
  "產假/侍產假": "bg-pink-50 text-pink-600 border-pink-200",
  "年假": "bg-blue-50 text-blue-700 border-blue-200",
  "調休": "bg-violet-50 text-violet-700 border-violet-200",
  "其他": "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Review panel ───────────────────────────────────────────
function ReviewPanel({ app, type, onClose, onApprove, onReject }: {
  app: CorrectionApp | LeaveApp | OvertimeApp;
  type: "correction" | "leave" | "overtime";
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [step, setStep]             = useState<"view" | "reject">("view");
  const [rejectNote, setRejectNote] = useState("");
  const [lightbox, setLightbox]     = useState(false);

  const isLeavApp = type === "leave";
  const isOtApp   = type === "overtime";
  const isCorrApp = type === "correction";
  const la = app as LeaveApp;
  const oa = app as OvertimeApp;
  const ca = app as CorrectionApp;

  const detailRows: [string, string][] = [];
  if (isCorrApp) {
    detailRows.push(["補卡日期", ca.date], ["班次時間", ca.shiftTime], ["補卡類型", ca.correctionType], ["提交時間", ca.submittedAt]);
  } else if (isLeavApp) {
    detailRows.push(["請假類型", la.leaveType], ["請假日期", `${la.startDate} 至 ${la.endDate}`], ["請假天數", `${la.totalDays} 天`], ["提交時間", la.submittedAt]);
  } else {
    detailRows.push(["加班開始", oa.startDateTime], ["加班結束", oa.endDateTime], ["加班時數", `${oa.hours} 小時`], ["提交時間", oa.submittedAt]);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_CFG[app.status].color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[app.status].dot}`} />{app.status}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">{app.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Employee info */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
            {[["姓名", app.name],["電話", app.phone],["工種", app.jobTitle],["門店", app.store]].map(([l,v]) => (
              <div key={l} className="flex gap-3">
                <span className="text-xs text-slate-400 w-12 shrink-0 pt-0.5">{l}</span>
                <span className="text-sm text-slate-800 font-medium">{v}</span>
              </div>
            ))}
          </div>

          {/* Application details */}
          <div className="space-y-2.5">
            {isLeavApp && (
              <div className="flex gap-3">
                <span className="text-xs text-slate-400 w-14 shrink-0 pt-0.5">請假類型</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${LEAVE_TYPE_COLORS[la.leaveType] ?? ""}`}>{la.leaveType}</span>
              </div>
            )}
            {detailRows.filter(([l]) => l !== "請假類型").map(([l, v]) => (
              <div key={l} className="flex gap-3">
                <span className="text-xs text-slate-400 w-14 shrink-0 pt-0.5">{l}</span>
                <span className="text-sm text-slate-800 font-medium">{v}</span>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5">申請原因</div>
            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{app.reason}</div>
          </div>

          {/* Photo */}
          {app.photo && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5">附件照片</div>
              <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100 cursor-pointer group" onClick={() => setLightbox(true)}>
                <img src={app.photo} alt="附件" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}

          {/* Review result */}
          {app.reviewedAt && (
            <div className={`rounded-xl p-3 border text-sm ${app.status === "已批准" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
              <div className="font-semibold mb-1">{app.status === "已批准" ? "✓ 已批准" : "✕ 已拒絕"} · {app.reviewedAt}</div>
              {app.reviewNote && <div className="text-xs opacity-80">{app.reviewNote}</div>}
            </div>
          )}

          {step === "reject" && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600">駁回原因 <span className="text-red-500">*</span></div>
              <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="請說明駁回原因…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          )}
        </div>

        {app.status === "待審核" && (
          <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
            {step === "view" ? (
              <>
                <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setStep("reject")}><XCircle className="w-4 h-4 mr-1.5" />拒絕</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { onApprove(app.id); onClose(); }}><CheckCircle2 className="w-4 h-4 mr-1.5" />批准</Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setStep("view")}>返回</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={!rejectNote.trim()} onClick={() => { onReject(app.id, rejectNote); onClose(); }}>確認拒絕</Button>
              </>
            )}
          </div>
        )}

        {lightbox && (
          <Dialog open onOpenChange={() => setLightbox(false)}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200"><DialogTitle className="text-sm font-semibold">附件照片</DialogTitle><DialogDescription className="sr-only">照片預覽</DialogDescription></div>
              <div className="bg-slate-50 p-4 flex items-center justify-center"><img src={app.photo} alt="附件" className="max-w-full max-h-[360px] rounded-lg object-contain" /></div>
              <div className="px-5 py-3 border-t border-slate-200 flex justify-end"><button onClick={() => setLightbox(false)} className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">關閉</button></div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function AttendanceApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") ?? "correction") as "correction" | "leave" | "overtime";

  const [corrections, setCorrections] = useState<CorrectionApp[]>(MOCK_CORRECTIONS);
  const [leaves, setLeaves]           = useState<LeaveApp[]>(MOCK_LEAVES);
  const [overtimes, setOvertimes]     = useState<OvertimeApp[]>(MOCK_OVERTIME);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewTarget, setReviewTarget] = useState<CorrectionApp | LeaveApp | OvertimeApp | null>(null);

  const PAGE_CONFIG = {
    correction: { title: "補卡申請", icon: <ClipboardCheck className="w-5 h-5" />, data: corrections as BaseApp[], pending: corrections.filter(x => x.status === "待審核").length },
    leave:      { title: "請假申請", icon: <Calendar className="w-5 h-5" />,       data: leaves as BaseApp[],      pending: leaves.filter(x => x.status === "待審核").length },
    overtime:   { title: "加班申請", icon: <Clock className="w-5 h-5" />,          data: overtimes as BaseApp[],   pending: overtimes.filter(x => x.status === "待審核").length },
  };
  const cfg = PAGE_CONFIG[type];

  const allData: (CorrectionApp | LeaveApp | OvertimeApp)[] =
    type === "correction" ? corrections : type === "leave" ? leaves : overtimes;

  const filtered = allData.filter(x => statusFilter === "all" || x.status === statusFilter);

  const handleApprove = (id: string) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    if (type === "correction") setCorrections(prev => prev.map(x => x.id === id ? {...x, status: "已批准", reviewedAt: now, reviewNote: "申請已批准"} : x));
    else if (type === "leave")  setLeaves(prev => prev.map(x => x.id === id ? {...x, status: "已批准", reviewedAt: now, reviewNote: "申請已批准"} : x));
    else setOvertimes(prev => prev.map(x => x.id === id ? {...x, status: "已批准", reviewedAt: now, reviewNote: "申請已批准"} : x));
  };
  const handleReject = (id: string, note: string) => {
    const now = new Date().toISOString().slice(0,10) + " " + new Date().toTimeString().slice(0,5);
    if (type === "correction") setCorrections(prev => prev.map(x => x.id === id ? {...x, status: "已拒絕", reviewedAt: now, reviewNote: note} : x));
    else if (type === "leave")  setLeaves(prev => prev.map(x => x.id === id ? {...x, status: "已拒絕", reviewedAt: now, reviewNote: note} : x));
    else setOvertimes(prev => prev.map(x => x.id === id ? {...x, status: "已拒絕", reviewedAt: now, reviewNote: note} : x));
  };

  const getSubtitle = (app: CorrectionApp | LeaveApp | OvertimeApp) => {
    if (type === "correction") return `${(app as CorrectionApp).date} · ${(app as CorrectionApp).correctionType}`;
    if (type === "leave")      return `${(app as LeaveApp).startDate}${(app as LeaveApp).startDate !== (app as LeaveApp).endDate ? ` 至 ${(app as LeaveApp).endDate}` : ""} · ${(app as LeaveApp).leaveType}`;
    return `${(app as OvertimeApp).startDateTime.slice(5,16)} · ${(app as OvertimeApp).hours}h`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/attendance")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /><span className="text-sm">返回考勤管理</span>
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{cfg.icon}</span>
                <h1 className="text-xl font-semibold text-slate-900">{cfg.title}</h1>
                {cfg.pending > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">{cfg.pending} 件待審核</span>
                )}
              </div>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {/* Status filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="relative inline-block">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className={`h-8 pl-3 pr-7 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusFilter !== "all" ? "border-blue-400 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-600"}`}>
                <option value="all">全部狀態</option>
                <option value="待審核">待審核</option>
                <option value="已批准">已批准</option>
                <option value="已拒絕">已拒絕</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Applications list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm">暫無{statusFilter === "待審核" ? "待審核的" : ""}申請記錄</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(app => {
                  const cfg_s = STATUS_CFG[app.status];
                  return (
                    <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">{app.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg_s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg_s.dot}`} />{app.status}
                          </span>
                          {type === "leave" && (
                            <span className={`inline-flex px-1.5 py-0 rounded-full border text-[10px] font-medium ${LEAVE_TYPE_COLORS[(app as LeaveApp).leaveType] ?? ""}`}>
                              {(app as LeaveApp).leaveType}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                          <span>{app.jobTitle} · {app.store}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getSubtitle(app)}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">提交：{app.submittedAt}</div>
                      </div>
                      <button onClick={() => setReviewTarget(app)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${app.status === "待審核" ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        <FileText className="w-3 h-3" />{app.status === "待審核" ? "去審批" : "查看"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {reviewTarget && (
        <ReviewPanel
          app={reviewTarget}
          type={type}
          onClose={() => setReviewTarget(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
