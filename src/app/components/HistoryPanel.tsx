import { useState } from "react";
import {
  X, Phone, ClipboardList, Briefcase, XCircle,
  RotateCcw, AlertTriangle, Award, ChevronDown, MapPin, Calendar,
} from "lucide-react";
import {
  CANDIDATE_HISTORY_MAP, getHistoryStats,
  type CandidateHistory, type HistoryEntry, type EntryStatus,
} from "../data/candidateHistory";

const STATUS_CFG: Record<EntryStatus, { color: string; dot: string; label: string }> = {
  "已錄用":    { color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500",           label: "已錄用" },
  "已拒絕":    { color: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-500",             label: "已拒絕" },
  "已撤回":    { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500",          label: "已撤回" },
  "待審核":    { color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400",           label: "待審核" },
  "在職":      { color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500 animate-pulse", label: "在職中" },
  "已完成":    { color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-400",            label: "已完成離職" },
  "異常終止":  { color: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-500",             label: "異常終止" },
};

const HIRING_COLORS: Record<"全職" | "兼職" | "臨時工", string> = {
  "全職":   "bg-blue-50 text-blue-600 border-blue-200",
  "兼職":   "bg-indigo-50 text-indigo-600 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-600 border-violet-200",
};

const AVATAR_COLORS = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-rose-100 text-rose-700","bg-amber-100 text-amber-700","bg-cyan-100 text-cyan-700"];
function avatarColor(id: string) { return AVATAR_COLORS[parseInt(id.replace("APP-",""),10) % AVATAR_COLORS.length]; }

function HistoryEntryCard({ entry, isLast }: { entry: HistoryEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[entry.status];
  const hasDetail = !!(entry.rejectReason || entry.revokeDetail || entry.evaluation || entry.terminationReason);

  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ring-slate-200 shrink-0 ${cfg.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1.5 min-h-[28px]" />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-5"}`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {entry.kind === "application"
              ? <ClipboardList className="w-3.5 h-3.5 text-violet-400" />
              : <Briefcase className="w-3.5 h-3.5 text-blue-400" />}
            <span className="text-xs font-medium text-slate-500">
              {entry.kind === "application" ? "申請記錄" : "在職記錄"}
            </span>
          </div>
          <span className="text-xs text-slate-400 tabular-nums shrink-0">{entry.date}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">{entry.jobTitle}</div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{entry.store}</span>
                <span className="text-slate-300">·</span>
                <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${HIRING_COLORS[entry.hiringType]}`}>{entry.hiringType}</span>
              </div>
              {entry.kind === "employment" && (
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{entry.date}</span><span>→</span>
                  <span>{entry.endDate ?? "進行中"}</span>
                  {entry.durationLabel && <><span className="text-slate-300">·</span><span>{entry.durationLabel}</span></>}
                </div>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot.replace(" animate-pulse","")}`} />
              {cfg.label}
            </span>
          </div>
          {hasDetail && (
            <>
              <button onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors mt-1">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                {expanded ? "收起" : entry.evaluation ? "查看評價" : "查看原因"}
              </button>
              {expanded && (
                <div className="mt-3 space-y-2.5">
                  {entry.evaluation && (
                    <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />工作評價</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.evaluation.comment}</p>
                    </div>
                  )}
                  {entry.rejectReason && (
                    <div className="bg-red-50/70 border border-red-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />拒絕原因</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.rejectReason}</p>
                    </div>
                  )}
                  {entry.revokeDetail && (
                    <div className="bg-orange-50/70 border border-orange-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-orange-700 mb-1.5 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />駁回原因
                        {entry.revokeReason && <span className="font-normal text-orange-600 ml-1">（{entry.revokeReason}）</span>}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.revokeDetail}</p>
                    </div>
                  )}
                  {entry.terminationReason && (
                    <div className="bg-red-50/70 border border-red-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />異常終止原因</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.terminationReason}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function HistoryPanel({ candidateId, displayName, onClose }: {
  candidateId: string;
  displayName: string;
  onClose: () => void;
}) {
  const candidate = CANDIDATE_HISTORY_MAP.get(candidateId);

  if (!candidate) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
        <div className="fixed right-0 top-0 bottom-0 w-[480px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
              <p className="text-sm text-slate-500 mt-0.5">工作記錄</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 px-6">
            <ClipboardList className="w-10 h-10 text-slate-300" />
            <div className="text-center">
              <div className="text-sm font-medium text-slate-600 mb-1">首次申請</div>
              <div className="text-xs text-slate-400">此候選人在本商戶暫無過往互動記錄</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const stats = getHistoryStats(candidate.entries);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[480px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${avatarColor(candidate.applicantId)}`}>
                {candidate.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-slate-900">{candidate.name}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${candidate.gender === "女" ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>{candidate.gender}</span>
                  <span className="text-xs text-slate-400">{candidate.age} 歲</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                  <Phone className="w-3 h-3 text-slate-400" />{candidate.phone}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <ClipboardList className="w-3.5 h-3.5 text-violet-500" />
              申請 <span className="font-semibold text-slate-900 ml-0.5">{stats.appCount}</span> 次
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              在職 <span className="font-semibold text-slate-900 ml-0.5">{stats.empCount}</span> 次
            </div>
            {stats.rejectCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                <XCircle className="w-3.5 h-3.5" />
                拒絕 <span className="font-semibold ml-0.5">{stats.rejectCount}</span> 次
              </div>
            )}
            {stats.revokeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                <RotateCcw className="w-3.5 h-3.5" />
                駁回 <span className="font-semibold ml-0.5">{stats.revokeCount}</span> 次
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            互動時間線 <span className="font-normal text-slate-400 normal-case">· 最新在前</span>
          </div>
          <div>
            {candidate.entries.map((entry, idx) => (
              <HistoryEntryCard
                key={entry.id}
                entry={entry}
                isLast={idx === candidate.entries.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
