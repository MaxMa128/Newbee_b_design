import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  FileText, Search, X, Phone, MapPin, Calendar,
  Award, XCircle, ArrowLeft,
  AlertTriangle, ClipboardList, RotateCcw, Briefcase,
  ChevronDown, Users, ChevronRight,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import {
  CANDIDATE_HISTORIES, CANDIDATE_HISTORY_MAP,
  getHistoryStats,
  type CandidateHistory, type HistoryEntry, type EntryStatus,
} from "../data/candidateHistory";

// ── Config ─────────────────────────────────────────────────
const STATUS_CFG: Record<EntryStatus, { color: string; dot: string; label: string }> = {
  "已錄用":  { color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500",           label: "已錄用" },
  "已拒絕":  { color: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-500",             label: "已拒絕" },
  "已撤回":  { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500",          label: "已撤回" },
  "待審核":  { color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400",           label: "待審核" },
  "在職":   { color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500 animate-pulse", label: "在職中" },
  "已完成":  { color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-400",            label: "已完成離職" },
  "異常終止": { color: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-500",             label: "異常終止" },
};

const HIRING_COLORS: Record<"全職" | "兼職" | "臨時工", string> = {
  "全職":   "bg-blue-50 text-blue-600 border-blue-200",
  "兼職":   "bg-indigo-50 text-indigo-600 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-600 border-violet-200",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
];
function avatarColor(id: string) {
  return AVATAR_COLORS[parseInt(id.replace("APP-", ""), 10) % AVATAR_COLORS.length];
}

// ── Individual history entry in timeline ───────────────────
function HistoryEntryCard({ entry, isLast }: { entry: HistoryEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[entry.status];
  const hasDetail = !!(entry.rejectReason || entry.revokeDetail || entry.evaluation || entry.terminationReason);

  return (
    <div className="flex gap-3.5">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ring-slate-200 shrink-0 ${cfg.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1.5 min-h-[28px]" />}
      </div>

      {/* Card */}
      <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-5"}`}>
        {/* Kind label + date */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {entry.kind === "application" ? (
              <ClipboardList className="w-3.5 h-3.5 text-violet-400" />
            ) : (
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="text-xs font-medium text-slate-500">
              {entry.kind === "application" ? "申請記錄" : "在職記錄"}
            </span>
          </div>
          <span className="text-xs text-slate-400 tabular-nums shrink-0">{entry.date}</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
          {/* Job + status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">{entry.jobTitle}</div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{entry.store}</span>
                <span className="text-slate-300">·</span>
                <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${HIRING_COLORS[entry.hiringType]}`}>
                  {entry.hiringType}
                </span>
              </div>
              {entry.kind === "employment" && (
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{entry.date}</span>
                  <span>→</span>
                  <span>{entry.endDate ?? "進行中"}</span>
                  {entry.durationLabel && (
                    <span className="text-slate-300 mx-0.5">·</span>
                  )}
                  {entry.durationLabel && <span>{entry.durationLabel}</span>}
                </div>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot.replace(" animate-pulse","")}`} />
              {cfg.label}
            </span>
          </div>

          {/* Expand/collapse toggle */}
          {hasDetail && (
            <>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors mt-1"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                {expanded ? "收起" : entry.evaluation ? "查看評價詳情" : "查看原因"}
              </button>

              {expanded && (
                <div className="mt-3 space-y-2.5">
                  {entry.evaluation && (
                    <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />工作評價
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.evaluation.comment}</p>
                    </div>
                  )}
                  {entry.rejectReason && (
                    <div className="bg-red-50/70 border border-red-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />拒絕原因
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.rejectReason}</p>
                    </div>
                  )}
                  {entry.revokeDetail && (
                    <div className="bg-orange-50/70 border border-orange-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-orange-700 mb-1.5 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        駁回原因
                        {entry.revokeReason && (
                          <span className="font-normal text-orange-600 ml-1">（{entry.revokeReason}）</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.revokeDetail}</p>
                    </div>
                  )}
                  {entry.terminationReason && (
                    <div className="bg-red-50/70 border border-red-100 rounded-lg p-3">
                      <div className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />異常終止原因
                      </div>
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

// ── Candidate history panel (right drawer) ─────────────────
function CandidateHistoryPanel({
  candidate,
  fromReview,
  onClose,
}: {
  candidate: CandidateHistory;
  fromReview: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const stats = getHistoryStats(candidate.entries);

  const handleReturnToReview = () => {
    navigate(`/talent?applicant=${candidate.applicantId}`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[520px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">

        {/* Panel header */}
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${avatarColor(candidate.applicantId)}`}>
                {candidate.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-slate-900">{candidate.name}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${
                    candidate.gender === "女" ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}>{candidate.gender}</span>
                  <span className="text-xs text-slate-400">{candidate.age} 歲</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                  <Phone className="w-3 h-3 text-slate-400" />{candidate.phone}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-2 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stat badges */}
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
                拒絕錄用 <span className="font-semibold ml-0.5">{stats.rejectCount}</span> 次
              </div>
            )}
            {stats.revokeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                <XCircle className="w-3.5 h-3.5" />
                駁回錄用 <span className="font-semibold ml-0.5">{stats.revokeCount}</span> 次
              </div>
            )}
          </div>

          {/* Return to review CTA */}
          {fromReview && (
            <button
              onClick={handleReturnToReview}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回審核此候選人
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>互動時間線</span>
            <span className="text-slate-300">·</span>
            <span className="normal-case text-slate-400 font-normal">最新紀錄在前</span>
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

// ── Summary card ───────────────────────────────────────────
function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm mt-0.5">{label}</div>
    </div>
  );
}

// ── Latest entry status badge ──────────────────────────────
function LatestStatusBadge({ entries }: { entries: HistoryEntry[] }) {
  if (!entries.length) return null;
  const latest = entries[0];
  const cfg = STATUS_CFG[latest.status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot.replace(" animate-pulse","")}`} />
      {cfg.label}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function WorkRecordsPage() {
  const [searchParams] = useSearchParams();
  const candidateParam = searchParams.get("candidate");
  const fromReview     = searchParams.get("from") === "review";

  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateHistory | null>(null);

  useEffect(() => {
    if (candidateParam) {
      const found = CANDIDATE_HISTORY_MAP.get(candidateParam);
      if (found) setSelectedCandidate(found);
    }
  }, [candidateParam]);

  const filtered = CANDIDATE_HISTORIES.filter(c =>
    !search || c.name.includes(search) || c.phone.includes(search)
  );

  const totalCount     = CANDIDATE_HISTORIES.length;
  const goodCount      = CANDIDATE_HISTORIES.filter(c => getHistoryStats(c.entries).hasGoodRecord).length;
  const warningCount   = CANDIDATE_HISTORIES.filter(c => getHistoryStats(c.entries).hasRejection).length;
  const workingCount   = CANDIDATE_HISTORIES.filter(c => getHistoryStats(c.entries).currentlyWorking).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">工作記錄</h1>
              <p className="text-sm text-slate-500 mt-0.5">查看候選人在本商戶的所有申請及在職歷史</p>
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">

          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <SummaryCard label="有記錄候選人" value={totalCount} color="bg-white border-slate-200 text-slate-900" />
            <SummaryCard label="優質紀錄" value={goodCount} color="bg-green-50 border-green-200 text-green-800" />
            <SummaryCard label="需留意" value={warningCount} color="bg-red-50 border-red-200 text-red-800" />
            <SummaryCard label="當前在職" value={workingCount} color="bg-blue-50 border-blue-200 text-blue-800" />
          </div>

          {/* Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋候選人姓名或電話…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Candidate list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-20 flex flex-col items-center gap-3 text-slate-400">
              <Users className="w-10 h-10 text-slate-300" />
              <p className="text-sm">暫無符合條件的候選人記錄</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left w-[150px]">候選人</th>
                      <th className="px-4 py-3 text-left w-[130px]">聯絡電話</th>
                      <th className="px-4 py-3 text-center w-[70px]">申請次數</th>
                      <th className="px-4 py-3 text-center w-[70px]">在職次數</th>
                      <th className="px-4 py-3 text-center w-[80px]">拒絕錄用</th>
                      <th className="px-4 py-3 text-center w-[80px]">駁回錄用</th>
                      <th className="px-4 py-3 text-left w-[120px]">最新狀態</th>
                      <th className="px-4 py-3 text-left w-[100px]">最後互動</th>
                      <th className="px-4 py-3 text-left w-[70px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const stats = getHistoryStats(c.entries);
                      const latestDate = c.entries[0]?.date ?? "—";
                      return (
                        <tr
                          key={c.applicantId}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors cursor-pointer"
                          onClick={() => setSelectedCandidate(c)}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(c.applicantId)}`}>
                                {c.name[0]}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{c.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  <span className={`inline-flex px-1 py-0 rounded text-[10px] font-medium mr-1 ${
                                    c.gender === "女" ? "text-pink-500" : "text-blue-500"
                                  }`}>{c.gender}</span>
                                  {c.age} 歲
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 tabular-nums text-sm">{c.phone}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-semibold text-slate-900">{stats.appCount}</span>
                            <span className="text-xs text-slate-400 ml-0.5">次</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-semibold text-slate-900">{stats.empCount}</span>
                            <span className="text-xs text-slate-400 ml-0.5">次</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {stats.rejectCount >= 1 ? (
                              <span className="text-sm font-semibold text-red-600">{stats.rejectCount}</span>
                            ) : (
                              <span className="text-sm text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {stats.revokeCount >= 1 ? (
                              <span className="text-sm font-semibold text-red-600">{stats.revokeCount}</span>
                            ) : (
                              <span className="text-sm text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <LatestStatusBadge entries={c.entries} />
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-500 tabular-nums">{latestDate}</td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedCandidate(c); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              <FileText className="w-3 h-3" />查看
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="mt-3 text-xs text-slate-400 text-right">
              共 {filtered.length} 位候選人有互動記錄
            </div>
          )}
        </main>
      </div>

      {/* Candidate history panel */}
      {selectedCandidate && (
        <CandidateHistoryPanel
          candidate={selectedCandidate}
          fromReview={fromReview}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
