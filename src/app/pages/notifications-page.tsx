import { useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Briefcase, Users, Store, Building2,
  Bell, CheckCheck, MessageSquare, ArrowRight,
  Briefcase as BriefcaseIcon, Settings,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useNotifications, type Notification } from "../contexts/notification-context";

// ── Types ─────────────────────────────────────────────────

type ReadTab     = "all" | "unread";
type CategoryTab = "all" | "talent" | "system";

// ── Helpers ────────────────────────────────────────────────

function categoryLabel(tab: CategoryTab) {
  if (tab === "talent") return "求職申請";
  if (tab === "system") return "系統通知";
  return "全部種類";
}

function notifCategory(n: Notification): "talent" | "system" {
  return n.type === "talent" ? "talent" : "system";
}

function NotifCard({
  notif,
  onNavigate,
  onReview,
  onMarkRead,
}: {
  notif: Notification;
  onNavigate: () => void;
  onReview?: () => void;
  onMarkRead: () => void;
}) {
  const isTalent = notif.type === "talent";

  return (
    <div
      className={`flex items-start gap-4 px-6 py-4 border-b border-slate-100 last:border-0 transition-colors ${
        notif.read ? "bg-white" : "bg-blue-50/40"
      }`}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
          isTalent ? "bg-violet-50 border-violet-100" : "bg-blue-50 border-blue-100"
        }`}
      >
        {isTalent
          ? <Users className="w-4 h-4 text-violet-500" />
          : <Settings className="w-4 h-4 text-blue-400" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!notif.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
          <span className="text-sm font-semibold text-slate-800">{notif.title}</span>
          
        </div>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{notif.body}</p>
        <span className="text-xs text-slate-400 mt-1 block">{notif.createdAt}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {!notif.read && (
          null
        )}
        {isTalent && onReview && (
          <Button
            size="sm"
            onClick={() => { onMarkRead(); onReview(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 gap-1"
          >
            去審核
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
        {!isTalent && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onMarkRead(); onNavigate(); }}
            className="text-xs h-8 px-3 gap-1 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200"
          >
            查看詳情
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, unreadTalentCount, markRead, markAllRead } = useNotifications();

  const [readTab, setReadTab]         = useState<ReadTab>("all");
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("all");

  const filtered = notifications
    .filter(n => readTab === "all" || !n.read)
    .filter(n => categoryTab === "all" || notifCategory(n) === categoryTab)
    .sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const countFor = (rt: ReadTab, ct: CategoryTab) =>
    notifications
      .filter(n => rt === "all" || !n.read)
      .filter(n => ct === "all" || notifCategory(n) === ct)
      .length;

  const unreadForCategory = (ct: CategoryTab) =>
    notifications
      .filter(n => !n.read)
      .filter(n => ct === "all" || notifCategory(n) === ct)
      .length;

  const navItems = [
    { key: "dashboard",     icon: <LayoutDashboard className="w-5 h-5" />, label: "工作台",  path: "/dashboard",      badge: 0 },
    { key: "jobs",          icon: <Briefcase className="w-5 h-5" />,       label: "職位管理", path: "/jobs",           badge: 0 },
    { key: "talent",        icon: <Users className="w-5 h-5" />,           label: "人才管理", path: "/talent",         badge: unreadTalentCount },
    { key: "stores",        icon: <Store className="w-5 h-5" />,           label: "門店管理", path: "/stores",         badge: 0 },
    { key: "notifications", icon: <MessageSquare className="w-5 h-5" />,   label: "消息中心", path: "/notifications",  badge: unreadCount },
  ];

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
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.key === "notifications"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
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

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">消息中心</h1>
              <p className="text-sm text-slate-500 mt-0.5">查看所有系統通知及申請動態</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllRead}
                  className="gap-1.5 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200"
                >
                  <CheckCheck className="w-4 h-4" />
                  全部已讀
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-3xl">

            {/* ── Read-state tabs ── */}
            <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
              {([
                { key: "all",    label: "全部消息" },
                { key: "unread", label: "未讀消息" },
              ] as { key: ReadTab; label: string }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setReadTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium relative transition-colors ${
                    readTab === tab.key ? "text-blue-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    readTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {countFor(tab.key, categoryTab)}
                  </span>
                  {readTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Category filter pills ── */}
            <div className="flex items-center gap-2 mb-5">
              {([
                { key: "all",    label: "全部種類",  unread: unreadForCategory("all") },
                { key: "talent", label: "求職申請",  unread: unreadForCategory("talent") },
                { key: "system", label: "系統通知",  unread: unreadForCategory("system") },
              ] as { key: CategoryTab; label: string; unread: number }[]).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryTab(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    categoryTab === cat.key
                      ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {cat.label}
                  {cat.unread > 0 && (
                    <span className={`text-[11px] leading-none font-semibold px-1.5 py-0.5 rounded-full ${
                      categoryTab === cat.key
                        ? "bg-white/20 text-white"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {cat.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Notification list ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {filtered.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                  <Bell className="w-10 h-10 text-slate-200" />
                  <span className="text-sm">
                    {readTab === "unread" ? "暫無未讀消息" : "暫無符合條件的消息"}
                  </span>
                </div>
              ) : (
                filtered.map(n => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onMarkRead={() => markRead(n.id)}
                    onNavigate={() => navigate(n.targetPath)}
                    onReview={
                      n.type === "talent" && n.applicantId
                        ? () => navigate(`/talent?applicant=${n.applicantId}`)
                        : undefined
                    }
                  />
                ))
              )}
            </div>

            {readTab === "all" && filtered.length > 0 && unreadCount === 0 && (
              <p className="text-center text-xs text-slate-400 mt-4">所有消息均已讀</p>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
