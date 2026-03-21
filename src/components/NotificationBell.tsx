import { useState, useRef, useEffect } from "react";
import { Bell, CreditCard, Settings, Sparkles, Users, CheckCheck } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { uiText } from "@/lib/uiLanguage";

const typeConfig: Record<string, { icon: typeof Bell; className: string }> = {
  credits: { icon: CreditCard, className: "text-yellow-500" },
  system: { icon: Settings, className: "text-blue-500" },
  generation: { icon: Sparkles, className: "text-purple-500" },
  referral: { icon: Users, className: "text-green-500" },
};

interface NotificationBellProps {
  collapsed?: boolean;
}

const NotificationBell = ({ collapsed }: NotificationBellProps) => {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const renderItem = (n: Notification) => {
    const config = typeConfig[n.type] || typeConfig.system;
    const Icon = config.icon;
    return (
      <button
        key={n.id}
        onClick={() => { markOneRead(n.id); }}
        className={`theme-animated-surface w-full text-left px-3 py-3 flex items-start gap-2.5 rounded-[1.2rem] transition-colors ${
          n.read ? "opacity-60" : "bg-sidebar-accent/40"
        } hover:bg-sidebar-accent/60`}
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.className}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{n.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </p>
        </div>
        {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
      </button>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="theme-animated-surface relative flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors w-10 h-10"
        title={uiText({ ar: "الإشعارات", en: "Notifications" })}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-[340px] max-w-[calc(100vw-1.5rem)] theme-animated-surface border border-border rounded-[1.5rem] shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-sm font-semibold text-foreground">{uiText({ ar: "الإشعارات", en: "Notifications" })}</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  {uiText({ ar: "قراءة الكل", en: "Mark all read" })}
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[340px] overflow-y-auto p-1.5 space-y-0.5">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{uiText({ ar: "لا توجد إشعارات", en: "No notifications" })}</p>
            ) : (
              notifications.slice(0, 15).map(renderItem)
            )}
          </div>
          <div className="border-t border-border px-3 py-2">
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              className="unlock-pro-button text-xs text-primary-foreground w-full text-center rounded-xl py-2.5"
            >
              {uiText({ ar: "عرض كل الإشعارات", en: "View all notifications" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
