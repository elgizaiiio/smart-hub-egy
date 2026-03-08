import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Image, Film, Code2, FileText, Settings, CreditCard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FancyButton from "@/components/FancyButton";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  mode: string;
}

interface DesktopSidebarProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const navItems = [
  { path: "/", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Images", icon: Image },
  { path: "/videos", label: "Videos", icon: Film },
  { path: "/code", label: "Code", icon: Code2 },
  { path: "/files", label: "Files", icon: FileText },
];

const DesktopSidebar = ({ onSelectConversation, onNewChat, activeConversationId }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  const currentMode = location.pathname === "/" ? "chat"
    : location.pathname === "/images" ? "images"
    : location.pathname === "/videos" ? "videos"
    : location.pathname === "/code" ? "code"
    : location.pathname === "/files" ? "files"
    : "chat";

  useEffect(() => {
    loadUserInfo();
    loadConversations();
  }, [currentMode]);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const emailPrefix = user.email?.split("@")[0] || "User";
      setUserName(user.user_metadata?.full_name || emailPrefix);
      setUserEmail(user.email || "");
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
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at, mode")
      .eq("mode", currentMode)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (data) setConversations(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initial = userName.charAt(0).toUpperCase() || "U";

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-[100dvh] bg-sidebar border-r border-sidebar-border shrink-0">
      {/* New Chat */}
      <div className="p-3">
        <FancyButton
          onClick={() => {
            onNewChat?.();
            navigate(location.pathname);
          }}
          className="w-full"
        >
          + New chat
        </FancyButton>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="mx-3 my-2 border-t border-sidebar-border" />

      {/* Recent conversations */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="sticky top-0 z-10 bg-sidebar py-2">
          <p className="text-[11px] text-muted-foreground px-3 uppercase tracking-wider">Recent</p>
        </div>
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground px-3 py-4">No conversations yet</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation?.(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Bottom section */}
      <div className="p-3 space-y-2">
        {/* MC Balance */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-sidebar-foreground">MC Balance</span>
            <span className="text-xs text-muted-foreground">{credits.toFixed(0)}</span>
          </div>
          <div className="w-full h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Settings link */}
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings/profile")}
            className="flex-1 flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-sidebar-accent/60 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail || "Free Plan"}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
