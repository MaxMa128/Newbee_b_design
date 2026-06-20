import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Briefcase, Users, Store, Building2,
  MessageSquare, ChevronDown, ClipboardList, Briefcase as WorkIcon,
  Megaphone, FileText, CalendarDays, ClipboardCheck, CalendarClock,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNotifications } from "../contexts/notification-context";

interface SidebarProps {
  showSupportCard?: boolean;
  onContactSupport?: () => void;
}

const RECRUITMENT_PATHS = ["/jobs", "/stores", "/create-job"];
const TALENT_PATHS      = ["/talent", "/work-records"];
const SCHEDULE_PATHS    = ["/schedule", "/attendance"];

export function Sidebar({ showSupportCard, onContactSupport }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadTalentCount, unreadCount } = useNotifications();

  const path = location.pathname;

  const [recruitmentOpen, setRecruitmentOpen] = useState(
    RECRUITMENT_PATHS.includes(path)
  );
  const [talentOpen, setTalentOpen] = useState(
    TALENT_PATHS.includes(path)
  );
  const [scheduleOpen, setScheduleOpen] = useState(
    SCHEDULE_PATHS.includes(path)
  );

  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  const NavItem = ({
    navPath,
    icon,
    label,
    badge = 0,
    indent = false,
  }: {
    navPath: string;
    icon: React.ReactNode;
    label: string;
    badge?: number;
    indent?: boolean;
  }) => {
    const active = isActive(navPath);
    return (
      <button
        onClick={() => navigate(navPath)}
        className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${
          indent ? "pl-9 pr-3 py-2.5" : "px-3 py-2.5"
        } ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <span className={`shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge > 0 && (
          <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const GroupHeader = ({
    icon,
    label,
    open,
    onToggle,
    hasActive,
  }: {
    icon: React.ReactNode;
    label: string;
    open: boolean;
    onToggle: () => void;
    hasActive: boolean;
  }) => (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        hasActive ? "text-slate-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      <span className={`shrink-0 ${hasActive ? "text-blue-600" : "text-slate-400"}`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <ChevronDown
        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
  );

  const isRecruitmentActive = RECRUITMENT_PATHS.some(p => path === p || path.startsWith(p + "/"));
  const isTalentActive      = TALENT_PATHS.some(p => path === p);
  const isScheduleActive    = SCHEDULE_PATHS.some(p => path === p);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Brand */}
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

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-0.5">

          {/* 工作台 */}
          <NavItem navPath="/dashboard" icon={<LayoutDashboard className="w-4.5 h-4.5" />} label="工作台" />

          {/* 招聘管理 group */}
          <div>
            <GroupHeader
              icon={<Megaphone className="w-4.5 h-4.5" />}
              label="招聘管理"
              open={recruitmentOpen}
              onToggle={() => setRecruitmentOpen(o => !o)}
              hasActive={isRecruitmentActive}
            />
            {recruitmentOpen && (
              <div className="mt-0.5 space-y-0.5">
                <NavItem
                  navPath="/jobs"
                  icon={<Briefcase className="w-4 h-4" />}
                  label="職位管理"
                  indent
                />
                <NavItem
                  navPath="/stores"
                  icon={<Store className="w-4 h-4" />}
                  label="門店管理"
                  indent
                />
              </div>
            )}
          </div>

          {/* 人才管理 group */}
          <div>
            <GroupHeader
              icon={<Users className="w-4.5 h-4.5" />}
              label="人才管理"
              open={talentOpen}
              onToggle={() => setTalentOpen(o => !o)}
              hasActive={isTalentActive}
            />
            {talentOpen && (
              <div className="mt-0.5 space-y-0.5">
                <NavItem
                  navPath="/talent"
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="求職記錄"
                  badge={unreadTalentCount}
                  indent
                />
                <NavItem
                  navPath="/work-records"
                  icon={<FileText className="w-4 h-4" />}
                  label="工作記錄"
                  indent
                />
              </div>
            )}
          </div>

          {/* 考勤排班 group */}
          <div>
            <GroupHeader
              icon={<CalendarClock className="w-4.5 h-4.5" />}
              label="考勤排班"
              open={scheduleOpen}
              onToggle={() => setScheduleOpen(o => !o)}
              hasActive={isScheduleActive}
            />
            {scheduleOpen && (
              <div className="mt-0.5 space-y-0.5">
                <NavItem
                  navPath="/schedule"
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="排班管理"
                  indent
                />
                <NavItem
                  navPath="/attendance"
                  icon={<ClipboardCheck className="w-4 h-4" />}
                  label="考勤管理"
                  indent
                />
              </div>
            )}
          </div>

          {/* 消息中心 */}
          <NavItem
            navPath="/notifications"
            icon={<MessageSquare className="w-4.5 h-4.5" />}
            label="消息中心"
            badge={unreadCount}
          />

        </div>
      </nav>

      {/* Support card (optional) */}
      {showSupportCard && (
        <div className="p-4 border-t border-slate-200">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-sm font-medium text-slate-900 mb-1">需要協助？</div>
            <div className="text-xs text-slate-600 mb-3">聯絡我們的專業團隊</div>
            <Button
              onClick={onContactSupport}
              variant="outline"
              size="sm"
              className="w-full text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              聯絡客服
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
