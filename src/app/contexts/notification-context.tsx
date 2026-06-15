import { createContext, useContext, useState, type ReactNode } from "react";

// ── Types ──────────────────────────────────────────────────
export type NotifType = "talent" | "job" | "system";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  targetPath: string;
  applicantId?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  unreadTalentCount: number;
  unreadJobCount: number;
  unreadApplicantIds: Set<string>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  markApplicantRead: (applicantId: string) => void;
  verificationStatus: VerificationStatus;
  setVerificationStatus: (s: VerificationStatus) => void;
}

// ── Mock initial data ──────────────────────────────────────
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "N-001", type: "talent", title: "新求職申請",
    body: "李小明 申請了 收銀員（旺角分店）",
    targetPath: "/talent", applicantId: "APP-002",
    createdAt: "2026-06-07", read: false,
  },
  {
    id: "N-002", type: "talent", title: "新求職申請",
    body: "張美儀 申請了 收銀員（旺角分店）",
    targetPath: "/talent", applicantId: "APP-003",
    createdAt: "2026-06-08", read: false,
  },
  {
    id: "N-003", type: "talent", title: "新求職申請",
    body: "王志豪 申請了 收銀員（旺角分店）",
    targetPath: "/talent", applicantId: "APP-004",
    createdAt: "2026-06-08", read: false,
  },
  {
    id: "N-004", type: "talent", title: "新求職申請",
    body: "吳家俊 申請了 倉務員（葵涌倉庫）",
    targetPath: "/talent", applicantId: "APP-005",
    createdAt: "2026-06-03", read: false,
  },
  {
    id: "N-005", type: "talent", title: "新求職申請",
    body: "鄭偉明 申請了 倉務員（葵涌倉庫）",
    targetPath: "/talent", applicantId: "APP-006",
    createdAt: "2026-06-04", read: false,
  },
  {
    id: "N-006", type: "talent", title: "新求職申請",
    body: "梁志偉 申請了 侍應生（中環分店）",
    targetPath: "/talent", applicantId: "APP-009",
    createdAt: "2026-06-09", read: false,
  },
  {
    id: "N-007", type: "talent", title: "新求職申請",
    body: "謝麗珊 申請了 侍應生（中環分店）",
    targetPath: "/talent", applicantId: "APP-010",
    createdAt: "2026-06-09", read: false,
  },
  {
    id: "N-008", type: "talent", title: "新求職申請",
    body: "何俊賢 申請了 侍應生（中環分店）",
    targetPath: "/talent", applicantId: "APP-011",
    createdAt: "2026-06-09", read: false,
  },
  {
    id: "N-009", type: "job", title: "職位已滿員",
    body: "推廣員（尖沙咀分店）招聘名額已達標，已自動下架。",
    targetPath: "/jobs",
    createdAt: "2026-06-03", read: false,
  },
  {
    id: "N-010", type: "system", title: "招聘額度提示",
    body: "您的招聘信用額度已使用 35%，目前運作正常。",
    targetPath: "/dashboard",
    createdAt: "2026-06-01", read: true,
  },
  {
    id: "N-011", type: "job", title: "新職位已發佈",
    body: "收銀員（旺角分店）已成功發佈，開始接受申請。",
    targetPath: "/jobs",
    createdAt: "2026-06-05", read: true,
  },
];

// ── Context ────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");

  // Job-type notifications are system events and do not contribute to the active badge count
  const unreadCount = notifications.filter(n => !n.read && n.type !== "job").length;
  const unreadTalentCount = notifications.filter(n => !n.read && n.type === "talent").length;
  const unreadJobCount = notifications.filter(n => !n.read && n.type === "job").length;
  const unreadApplicantIds = new Set(
    notifications.filter(n => !n.read && n.type === "talent" && n.applicantId).map(n => n.applicantId!)
  );

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markApplicantRead = (applicantId: string) => {
    setNotifications(prev =>
      prev.map(n => n.applicantId === applicantId ? { ...n, read: true } : n)
    );
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, unreadTalentCount, unreadJobCount,
      unreadApplicantIds, markRead, markAllRead, markApplicantRead,
      verificationStatus, setVerificationStatus,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
