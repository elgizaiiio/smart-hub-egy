import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard, MessageSquare, ImageIcon, VideoIcon, Code2, FileText, Gift, Settings } from "lucide-react";
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

  const services = [
    { path: "/", label: "Chat", icon: MessageSquare },
    { path: "/images", label: "Images", icon: ImageIcon },
    { path: "/videos", label: "Videos", icon: VideoIcon },
    { path: "/code", label: "Code", icon: Code2 },
    { path: "/files", label: "Files", icon: FileText },
  ];

  const initial = userName.charAt(0).toUpperCase() || "U";

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
            {/* New chat */}
            <div className="p-3">
              <button
                onClick={() => { onNewChat(); onClose(); navigate(location.pathname); }}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                + New chat
              </button>
            </div>

            {/* Services */}
            <div className="px-3">
              <p className="text-[11px] text-muted-foreground px-3 py-2 uppercase tracking-wider">Services</p>
              <div className="space-y-0.5">
                {services.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); onClose(); }}
                      className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        location.pathname === item.path
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="px-5 py-2">
              <div className="border-t border-sidebar-border" />
            </div>

            {/* Referrals - gold accent */}
            <div className="px-3">
              <button
                onClick={() => { navigate("/settings/referrals"); onClose(); }}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  location.pathname === "/settings/referrals"
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-sidebar-foreground hover:bg-[#FFD700]/5"
                }`}
              >
                <Gift className="w-4 h-4 text-[#FFD700]" />
                <span>Referrals</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700] font-bold">20%</span>
              </button>
            </div>

            {/* Recent */}
            {showRecent && (
              <div className="flex-1 overflow-y-auto mt-1">
                <div className="sticky top-0 bg-sidebar z-10 px-3">
                  <div className="px-5 py-1">
                    <div className="border-t border-sidebar-border" />
                  </div>
                  <p className="text-[11px] text-muted-foreground px-3 py-2 uppercase tracking-wider">Recent</p>
                </div>
                <div className="px-3">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-4">No conversations yet</p>
                  ) : (
                    <div className="space-y-0.5">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => { onSelectConversation?.(conv.id); onClose(); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                            activeConversationId === conv.id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                        >
                          {conv.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!showRecent && <div className="flex-1" />}

            {/* Settings link */}
            <div className="px-3 py-1">
              <button
                onClick={() => { navigate("/settings"); onClose(); }}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  location.pathname === "/settings"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>

            {/* Bottom */}
            <div className="p-3 space-y-2 border-t border-sidebar-border">
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-sidebar-foreground">Credits</span>
                  <span className="text-xs text-muted-foreground">{credits.toFixed(2)}</span>
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
