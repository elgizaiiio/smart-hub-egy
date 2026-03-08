import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard, MessageSquare, Image, Video, Code, FileText, Clock } from "lucide-react";
import FancyButton from "@/components/FancyButton";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  mode: string;
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
  currentMode?: string;
}

const serviceItems = [
  { path: "/", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Images", icon: Image },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/code", label: "Programming", icon: Code },
  { path: "/files", label: "Files", icon: FileText },
];

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "images": return Image;
    case "videos": return Video;
    case "code": return Code;
    case "files": return FileText;
    default: return MessageSquare;
  }
};

const getRelativeTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `${diffMins}د`;
  if (diffHours < 24) return `${diffHours}س`;
  if (diffDays < 7) return `${diffDays}ي`;
  return date.toLocaleDateString("ar", { month: "short", day: "numeric" });
};

const groupConversations = (convs: Conversation[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "اليوم", items: [] },
    { label: "أمس", items: [] },
    { label: "هذا الأسبوع", items: [] },
    { label: "أقدم", items: [] },
  ];

  convs.forEach((c) => {
    const d = new Date(c.updated_at);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  });

  return groups.filter((g) => g.items.length > 0);
};

const AppSidebar = ({ open, onClose, onNewChat, onSelectConversation, activeConversationId, currentMode = "chat" }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  const showRecent = currentMode === "chat" || currentMode === "code" || currentMode === "images" || currentMode === "videos" || currentMode === "files";

  useEffect(() => {
    if (open) {
      if (showRecent) loadConversations();
      loadUserInfo();
    }
  }, [open, currentMode]);

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
    const modeFilter = currentMode === "code" ? "code" : currentMode === "images" ? "images" : currentMode === "videos" ? "videos" : currentMode === "files" ? "files" : "chat";
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at, mode")
      .eq("mode", modeFilter)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (data) setConversations(data);
  };

  const initial = userName.charAt(0).toUpperCase() || "U";
  const grouped = groupConversations(conversations);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-sidebar flex flex-col border-r border-sidebar-border"
          >
            <div className="p-3">
              <FancyButton
                onClick={() => { onNewChat(); onClose(); navigate(location.pathname); }}
                className="w-full"
              >
                + New chat
              </FancyButton>
            </div>

            {/* Services */}
            <div className="px-3">
              <p className="text-[11px] text-muted-foreground px-3 py-2 uppercase tracking-wider">Services</p>
              <div className="space-y-0.5">
                {serviceItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); onClose(); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                        location.pathname === item.path
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div className="mx-3 my-2 border-t border-sidebar-border" />

            {/* Recent - grouped by date */}
            {showRecent && (
              <div className="flex-1 overflow-y-auto px-3">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">لا توجد محادثات بعد</p>
                  </div>
                ) : (
                  grouped.map((group) => (
                    <div key={group.label} className="mb-3">
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider px-3 py-1.5 font-medium">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((conv) => {
                          const ModeIcon = getModeIcon(conv.mode);
                          const isActive = activeConversationId === conv.id;
                          return (
                            <button
                              key={conv.id}
                              onClick={() => { onSelectConversation?.(conv.id); onClose(); }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 group ${
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                              }`}
                            >
                              <ModeIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="flex-1 truncate">{conv.title}</span>
                              <span className="text-[10px] text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {getRelativeTime(conv.updated_at)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!showRecent && <div className="flex-1" />}

            {/* Separator */}
            <div className="mx-3 border-t border-sidebar-border" />

            <div className="p-3 space-y-2">
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-sidebar-foreground">MC Balance</span>
                  <span className="text-xs text-muted-foreground">{credits.toFixed(0)}</span>
                </div>
                <div className="w-full h-2 bg-sidebar-accent rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { navigate("/settings"); onClose(); }}
                  className="flex-1 flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-sidebar-accent transition-colors"
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
                  onClick={() => { navigate("/pricing"); onClose(); }}
                  className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  title="Upgrade"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
