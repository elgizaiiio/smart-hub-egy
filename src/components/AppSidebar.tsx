import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Pin, CreditCard, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  mode: string;
  is_pinned?: boolean;
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
  { path: "/", label: "Chat" },
  { path: "/images", label: "Images" },
  { path: "/videos", label: "Videos" },
  { path: "/code", label: "Programming" },
  { path: "/files", label: "Files" },
];

const COLOR_PALETTES = [
  { from: "hsl(230, 60%, 15%)", to: "hsl(250, 50%, 25%)", accent: "hsl(240, 70%, 40%)" },
  { from: "hsl(270, 50%, 18%)", to: "hsl(290, 45%, 28%)", accent: "hsl(280, 60%, 40%)" },
  { from: "hsl(170, 50%, 14%)", to: "hsl(160, 45%, 24%)", accent: "hsl(165, 60%, 35%)" },
  { from: "hsl(340, 45%, 18%)", to: "hsl(350, 40%, 28%)", accent: "hsl(345, 55%, 40%)" },
  { from: "hsl(25, 50%, 16%)", to: "hsl(35, 45%, 26%)", accent: "hsl(30, 60%, 38%)" },
  { from: "hsl(210, 20%, 14%)", to: "hsl(220, 18%, 24%)", accent: "hsl(215, 25%, 35%)" },
];

const AppSidebar = ({ open, onClose, onNewChat, onSelectConversation, activeConversationId, currentMode = "chat" }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  const palette = useMemo(() => {
    if (!open) return COLOR_PALETTES[0];
    return COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
  }, [open]);

  const showRecent = ["chat", "code", "images", "videos", "files"].includes(currentMode);

  useEffect(() => {
    if (open) {
      if (showRecent) loadConversations();
      loadUserInfo();
    }
  }, [open, currentMode]);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const emailPrefix = user.email?.split("@")[0] || "User";
    setUserName(user.user_metadata?.full_name || emailPrefix);
    setUserEmail(user.email || "");
    const { data: profile } = await supabase.from("profiles").select("credits, avatar_url, display_name").eq("id", user.id).single();
    if (profile) {
      setCredits(Number(profile.credits) || 0);
      setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
      if (profile.display_name) setUserName(profile.display_name);
    }
  };

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const modeFilter = currentMode === "code" ? "code" : currentMode === "images" ? "images" : currentMode === "videos" ? "videos" : currentMode === "files" ? "files" : "chat";
    const { data } = await supabase.from("conversations").select("id, title, updated_at, mode, is_pinned").eq("mode", modeFilter).eq("user_id", user.id).order("is_pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(30);
    if (data) setConversations(data);
  };

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
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col overflow-hidden rounded-r-2xl"
            style={{
              background: `linear-gradient(180deg, ${palette.from} 0%, ${palette.to} 100%)`,
            }}
          >
            {/* Animated particles overlay */}
            <div className="sidebar-points-wrapper">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="sidebar-point" />
              ))}
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* New Chat - fancy animated button */}
              <div className="p-3">
                <button
                  onClick={() => { onNewChat(); onClose(); navigate(location.pathname); }}
                  className="fancy-btn w-full"
                >
                  <span className="fold" />
                  <div className="points_wrapper">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="point" />
                    ))}
                  </div>
                  <span className="inner flex items-center justify-center gap-2 w-full text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    New chat
                  </span>
                </button>
              </div>

              {/* Services - no label */}
              <div className="px-3">
                <div className="space-y-0.5">
                  {serviceItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); onClose(); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        location.pathname === item.path
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white/90"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {(currentMode === "images" || currentMode === "videos") && (
                <div className="px-3 mt-2 mb-1">
                  <button
                    onClick={() => { navigate(currentMode === "images" ? "/images/studio" : "/videos/studio"); onClose(); }}
                    className="w-full py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Open Studio
                  </button>
                </div>
              )}

              {/* Recent - no label */}
              {showRecent && (
                <div className="flex-1 overflow-y-auto px-3 pt-2">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-white/30 px-3 py-4">No conversations yet</p>
                  ) : (
                    <div className="space-y-0.5">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => { onSelectConversation?.(conv.id); onClose(); }}
                          className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                            activeConversationId === conv.id
                              ? "bg-white/15 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white/80"
                          }`}
                        >
                          {conv.is_pinned && <Pin className="w-3 h-3 shrink-0 text-white/50" />}
                          <span className="truncate">{conv.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!showRecent && <div className="flex-1" />}

              {/* Bottom: credits bar + merged user/credits button */}
              <div className="p-3 space-y-2">
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white/80">MC Balance</span>
                    <span className="text-xs text-white/50">{credits.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 rounded-full transition-all" style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Merged user + credits as one bar with divider */}
                <div className="flex items-center rounded-xl overflow-hidden fancy-btn-bg">
                  <button
                    onClick={() => { navigate("/settings"); onClose(); }}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-medium text-white">
                        {initial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 truncate">{userName}</p>
                      <p className="text-[11px] text-white/40 truncate">{userEmail || "Free Plan"}</p>
                    </div>
                  </button>
                  <div className="w-px h-8 bg-white/15" />
                  <button
                    onClick={() => { navigate("/pricing"); onClose(); }}
                    className="w-12 h-full flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
                    title="Credits & Plans"
                  >
                    <CreditCard className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
