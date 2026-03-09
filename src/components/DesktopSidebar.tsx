import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ImageIcon, Video, Code2, FolderOpen, CreditCard, Crown, PanelLeftClose, PanelLeft, MessageCircle, Settings, LogOut, User, Sparkles, Layers, Bot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DesktopSidebarProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const mainNav = [
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Images", icon: ImageIcon },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/code", label: "Code", icon: Code2 },
  { path: "/files", label: "Files", icon: FolderOpen },
];

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const DesktopSidebar = ({ onSelectConversation, onNewChat, activeConversationId }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const emailPrefix = user.email?.split("@")[0] || "User";
      setUserName(user.user_metadata?.full_name || emailPrefix);
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, avatar_url, display_name")
        .eq("id", user.id)
        .single();
      if (profile) {
        setCredits(Number(profile.credits) || 0);
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
        if (profile.display_name) setUserName(profile.display_name);
      }

      const { data: convos } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(8);
      if (convos) setRecentChats(convos);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initial = userName.charAt(0).toUpperCase() || "U";

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <aside className={`hidden md:flex flex-col ${collapsed ? "w-[56px]" : "w-[180px]"} h-[100dvh] bg-sidebar/60 backdrop-blur-xl border-r border-sidebar-border/30 shrink-0 transition-all duration-200`}>
      {/* Brand + Toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2 pt-4 pb-3" : "justify-between px-4 pt-5 pb-4"}`}>
        {!collapsed && (
          <button
            onClick={() => { onNewChat?.(); navigate("/chat"); }}
            className="text-left hover:opacity-70 transition-opacity"
          >
            <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
              Megsy
            </span>
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/30 transition-colors"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex flex-col ${collapsed ? "px-1.5 items-center" : "px-2.5"} gap-0.5`}>
        {mainNav.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                      active
                        ? "text-sidebar-foreground bg-sidebar-accent/60"
                        : "text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "text-sidebar-foreground bg-sidebar-accent/60 backdrop-blur-sm"
                  : "text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Recent Chats */}
      {recentChats.length > 0 && !collapsed && (
        <div className="mt-5 flex flex-col flex-1 min-h-0">
          <span className="px-5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 mb-1.5">
            Recent
          </span>
          <div className="flex-1 overflow-y-auto px-2.5 space-y-0.5 scrollbar-none">
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectConversation?.(chat.id);
                  navigate("/chat");
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all truncate ${
                  activeConversationId === chat.id
                    ? "text-sidebar-foreground bg-sidebar-accent/50"
                    : "text-sidebar-foreground/35 hover:text-sidebar-foreground/65 hover:bg-sidebar-accent/25"
                }`}
              >
                {chat.title || "Untitled"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed: recent chats as icons */}
      {recentChats.length > 0 && collapsed && (
        <div className="mt-4 flex flex-col items-center gap-0.5 px-1.5 flex-1 min-h-0 overflow-y-auto scrollbar-none">
          {recentChats.slice(0, 5).map((chat) => (
            <Tooltip key={chat.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    onSelectConversation?.(chat.id);
                    navigate("/chat");
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                    activeConversationId === chat.id
                      ? "text-sidebar-foreground bg-sidebar-accent/50"
                      : "text-sidebar-foreground/35 hover:text-sidebar-foreground/65 hover:bg-sidebar-accent/25"
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {chat.title || "Untitled"}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Spacer */}
      {recentChats.length === 0 && <div className="flex-1" />}

      {/* Bottom */}
      <div className={`flex flex-col ${collapsed ? "px-1.5 items-center" : "px-2.5"} pb-4 gap-1.5 mt-auto`}>
        {/* Credits */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/pricing")}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
              >
                <span className="text-[11px] font-bold tabular-nums">{credits.toFixed(0)}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Credits: {credits.toFixed(0)}
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
          >
            <span className="text-[11px] font-medium">Credits</span>
            <span className="text-[12px] font-semibold tabular-nums text-sidebar-foreground/70">
              {credits.toFixed(0)}
            </span>
          </button>
        )}

        {/* Upgrade */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/pricing")}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
              >
                <Crown className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Upgrade to Pro
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => navigate("/pricing")}
            className="w-full px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-center"
          >
            Upgrade to Pro
          </button>
        )}

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {collapsed ? (
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-sidebar-accent/30 transition-colors">
                <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-sidebar-border/50">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary">
                      {initial}
                    </div>
                  )}
                </div>
              </button>
            ) : (
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sidebar-accent/30 transition-colors w-full">
                <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-sidebar-border/50 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary">
                      {initial}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-sidebar-foreground/70 truncate">
                  {userName}
                </span>
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-44">
            <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
