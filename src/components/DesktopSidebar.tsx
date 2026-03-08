import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, ImageIcon, Video, Code2, FolderOpen, Settings, CreditCard, Sparkles, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import FancyButton from "@/components/FancyButton";
import logo from "@/assets/logo.png";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  mode: string;
}

const navItems = [
  { path: "/", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Images", icon: ImageIcon },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/code", label: "Code", icon: Code2 },
  { path: "/files", label: "Files", icon: FolderOpen },
];

interface DesktopSidebarProps {
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
}

const DesktopSidebar = ({ onNewChat, onSelectConversation, activeConversationId }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  const currentMode = location.pathname === "/" ? "chat"
    : location.pathname === "/images" ? "images"
    : location.pathname === "/videos" ? "videos"
    : location.pathname.startsWith("/code") ? "code"
    : location.pathname === "/files" ? "files"
    : "chat";

  useEffect(() => {
    loadUserInfo();
    loadConversations();
  }, [currentMode]);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
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
    }
  };

  const loadConversations = async () => {
    const modeFilter = currentMode;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at, mode")
      .eq("mode", modeFilter)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (data) setConversations(data);
  };

  const initial = userName.charAt(0).toUpperCase() || "U";

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 280 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="h-full flex flex-col border-r border-border/40 bg-card/40 backdrop-blur-2xl relative"
      style={{ minWidth: collapsed ? 68 : 280 }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo + New Chat */}
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <img src={logo} alt="Megsy" className="w-8 h-8 rounded-lg" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display font-bold text-lg text-foreground tracking-tight"
            >
              Megsy
            </motion.span>
          )}
        </div>

        {collapsed ? (
          <button
            onClick={() => { onNewChat?.(); navigate(location.pathname); }}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
          <FancyButton
            onClick={() => { onNewChat?.(); navigate(location.pathname); }}
            className="w-full"
          >
            + New chat
          </FancyButton>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="mx-3 my-3 border-t border-border/30" />

      {/* Recent conversations */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest px-3 py-2 font-medium">
            Recent
          </p>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 px-3 py-4">No conversations yet</p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation?.(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] truncate transition-all duration-150 ${
                    activeConversationId === conv.id
                      ? "bg-primary/8 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  {conv.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {collapsed && <div className="flex-1" />}

      {/* Bottom section */}
      <div className="p-2 space-y-1 border-t border-border/30">
        {/* Credits */}
        {!collapsed && (
          <div className="px-3 py-2.5 rounded-xl bg-accent/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground/70">MC Balance</span>
              <span className="text-xs font-semibold text-foreground">{credits.toFixed(0)}</span>
            </div>
            <div className="w-full h-1.5 bg-background/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className={`w-full flex items-center gap-3 rounded-xl transition-colors ${
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          } text-muted-foreground hover:text-foreground hover:bg-accent/30`}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>

        {/* User */}
        <button
          onClick={() => navigate("/settings/profile")}
          className={`w-full flex items-center gap-3 rounded-xl transition-colors ${
            collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
          } hover:bg-accent/30`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-border/40" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-medium text-primary shrink-0">
              {initial}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-foreground truncate">{userName}</p>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default DesktopSidebar;
