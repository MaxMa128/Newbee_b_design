import { useNavigate } from "react-router";
import { Bell, Briefcase, Users, LayoutDashboard, CheckCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNotifications, type Notification, type NotifType } from "../contexts/notification-context";

function typeIcon(type: NotifType) {
  if (type === "talent")  return <Users className="w-3.5 h-3.5 text-violet-500" />;
  if (type === "job")     return <Briefcase className="w-3.5 h-3.5 text-blue-500" />;
  return <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />;
}

function typeIconBg(type: NotifType) {
  if (type === "talent") return "bg-violet-50 border-violet-100";
  if (type === "job")    return "bg-blue-50 border-blue-100";
  return "bg-slate-50 border-slate-100";
}

function NotifItem({ notif, onClick }: { notif: Notification; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0 ${
        notif.read ? "opacity-60" : ""
      }`}
    >
      {/* Type icon */}
      <div className={`mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${typeIconBg(notif.type)}`}>
        {typeIcon(notif.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {!notif.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-800 truncate">{notif.title}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
        <span className="text-[11px] text-slate-400 mt-1 block">{notif.createdAt}</span>
      </div>
    </button>
  );
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const handleClick = (notif: Notification) => {
    markRead(notif.id);
    navigate(notif.targetPath);
  };

  // Sort: unread first, then by date desc
  const sorted = [...notifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          
          {unreadCount > 0 && (
            null
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 shadow-lg border-slate-200 rounded-xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">消息通知</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                {unreadCount} 未讀
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              全部已讀
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto bg-white">
          {sorted.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">暫無消息通知</div>
          ) : (
            sorted.map(n => (
              <NotifItem key={n.id} notif={n} onClick={() => handleClick(n)} />
            ))
          )}
        </div>

        {/* Footer */}
        {unreadCount === 0 && sorted.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <span className="text-xs text-slate-400">所有消息均已讀</span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
