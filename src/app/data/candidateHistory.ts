// Shared candidate work history data for this merchant
// Used by work-records-page and talent-page

export type EntryStatus =
  | "已錄用" | "已拒絕" | "已撤回" | "待審核"   // application statuses
  | "在職"  | "已完成" | "異常終止";             // employment statuses

export interface HistoryEntry {
  id: string;
  kind: "application" | "employment";
  jobId: string;
  jobTitle: string;
  hiringType: "全職" | "兼職" | "臨時工";
  store: string;
  date: string;            // application date or employment start date
  endDate?: string;        // employment end date
  durationLabel?: string;
  status: EntryStatus;
  // Application specific
  rejectReason?: string;
  revokeReason?: string;
  revokeDetail?: string;
  // Employment specific
  evaluation?: { rating: number; comment: string };
  terminationReason?: string;
}

export interface CandidateHistory {
  applicantId: string;
  name: string;
  phone: string;
  gender: "男" | "女";
  age: number;
  entries: HistoryEntry[]; // sorted newest first
}

export const CANDIDATE_HISTORIES: CandidateHistory[] = [
  {
    applicantId: "APP-001",
    name: "陳大文", phone: "+852 9123 4567", gender: "男", age: 28,
    entries: [
      {
        id: "WH-001-3", kind: "application",
        jobId: "JOB-001", jobTitle: "收銀員", hiringType: "兼職", store: "旺角分店",
        date: "2026-06-06", status: "已錄用",
      },
      {
        id: "WH-001-1", kind: "employment",
        jobId: "JOB-001", jobTitle: "收銀員", hiringType: "兼職", store: "旺角分店",
        date: "2025-09-15", endDate: "2025-12-31", durationLabel: "約 3.5 個月",
        status: "已完成",
        evaluation: {
          rating: 4,
          comment: "工作態度認真，準時上班，與同事相處融洽。偶爾需要提醒核對收銀金額，整體表現良好，建議再次錄用。",
        },
      },
      {
        id: "WH-001-2", kind: "application",
        jobId: "JOB-001", jobTitle: "收銀員", hiringType: "兼職", store: "旺角分店",
        date: "2025-09-10", status: "已錄用",
      },
    ],
  },
  {
    applicantId: "APP-007",
    name: "黃曉恩", phone: "+852 5789 0123", gender: "女", age: 24,
    entries: [
      {
        id: "WH-007-3", kind: "application",
        jobId: "JOB-003", jobTitle: "侍應生", hiringType: "臨時工", store: "中環分店",
        date: "2026-06-08", status: "已錄用",
      },
      {
        id: "WH-007-1", kind: "employment",
        jobId: "JOB-003", jobTitle: "侍應生", hiringType: "臨時工", store: "中環分店",
        date: "2025-12-20", endDate: "2025-12-20", durationLabel: "1 日",
        status: "已完成",
        evaluation: {
          rating: 5,
          comment: "非常專業，服務態度出色，客人反饋極為正面。待人有禮，適應能力強。強烈推薦再次錄用。",
        },
      },
      {
        id: "WH-007-2", kind: "application",
        jobId: "JOB-003", jobTitle: "侍應生", hiringType: "臨時工", store: "中環分店",
        date: "2025-12-18", status: "已錄用",
      },
    ],
  },
  {
    applicantId: "APP-013",
    name: "許志安", phone: "+852 9345 6781", gender: "男", age: 30,
    entries: [
      {
        id: "WH-013-2", kind: "application",
        jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店",
        date: "2026-06-02", status: "已錄用",
      },
      {
        id: "WH-013-1", kind: "application",
        jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店",
        date: "2025-11-05", status: "已拒絕",
        rejectReason: "過往推廣經驗不符合本次活動要求，需要具備零售品牌活動推廣經驗。建議日後補充相關技能後重新申請。",
      },
    ],
  },
  {
    applicantId: "APP-014",
    name: "盧嘉欣", phone: "+852 5456 7892", gender: "女", age: 21,
    entries: [
      {
        id: "WH-014-2", kind: "application",
        jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店",
        date: "2026-06-03", status: "已錄用",
      },
      {
        id: "WH-014-1", kind: "employment",
        jobId: "JOB-004", jobTitle: "推廣員", hiringType: "臨時工", store: "尖沙咀分店",
        date: "2026-07-01", endDate: "2026-07-02", durationLabel: "中途終止",
        status: "異常終止",
        terminationReason: "候選人提前離場，未完成第三日工作。已通知其不再安排同類崗位。",
      },
    ],
  },
];

export const CANDIDATE_HISTORY_MAP = new Map<string, CandidateHistory>(
  CANDIDATE_HISTORIES.map(c => [c.applicantId, c])
);

export function getHistoryStats(entries: HistoryEntry[]) {
  const appCount     = entries.filter(e => e.kind === "application").length;
  const empCount     = entries.filter(e => e.kind === "employment").length;
  const rejectCount  = entries.filter(e => e.status === "已拒絕").length;
  const revokeCount  = entries.filter(e => e.status === "已撤回").length;
  const hasRiskFlag  = rejectCount > 0 || revokeCount > 0 || entries.some(e => e.status === "異常終止");
  const currentlyWorking = entries.some(e => e.kind === "employment" && e.status === "在職");
  return { appCount, empCount, rejectCount, revokeCount, hasRiskFlag, currentlyWorking };
}
