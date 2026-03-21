import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard } from "lucide-react";
import FancyButton from "@/components/FancyButton";
import { supabase } from "@/integrations/supabase/client";
import { useAppLanguage } from "@/hooks/useAppLanguage";

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
  const { isArabic } = useAppLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const serviceItems = [
    { path: "/", label: isArabic ? "الدردشة" : "Chat" },
    { path: "/images", label: isArabic ? "الصور" : "Images" },
    { path: "/videos", label: isArabic ? "الفيديو" : "Videos" },
    { path: "/code", label: isArabic ? "البرمجة" : "Programming" },
    { path: "/files", label: isArabic ? "الملفات" : "Files" },
  ];

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const modeFilter = currentMode === "code" ? "code" : currentMode === "images" ? "images" : currentMode === "videos" ? "videos" : currentMode === "files" ? "files" : "chat";
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at, mode")
      .eq("mode", modeFilter)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);
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
            className="fixed left-0 top-0 bottom-0 z-50 w-[292px] bg-sidebar/96 flex flex-col border-r border-sidebar-border backdrop-blur-2xl"
          >
            <div className="p-3">
              <FancyButton
                onClick={() => { onNewChat(); onClose(); navigate(location.pathname); }}
                className="w-full"
              >
                {isArabic ? "+ محادثة جديدة" : "+ New chat"}
              </FancyButton>
            </div>

            {/* Services */}
            <div className="px-3">
              <p className="text-[11px] text-muted-foreground px-3 py-2 uppercase tracking-wider">{isArabic ? "الخدمات" : "Services"}</p>
              <div className="space-y-1.5">
                {serviceItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className={`unlock-chip w-full text-left px-4 py-3 rounded-2xl text-sm transition-colors ${
                      location.pathname === item.path
                        ? "border-primary/30 text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="mx-3 my-2 border-t border-sidebar-border" />

            {/* Studio link for images/videos */}
            {(currentMode === "images" || currentMode === "videos") && (
              <div className="px-3 mb-2">
                <button
                  onClick={() => { navigate(currentMode === "images" ? "/images/studio" : "/videos/studio"); onClose(); }}
                  className="unlock-chip w-full py-3 rounded-2xl text-primary text-sm font-medium transition-colors"
                >
                  {isArabic ? "فتح الاستوديو" : "Open Studio"}
                </button>
              </div>
            )}

            {/* Recent */}
            {showRecent && (
              <div className="flex-1 overflow-y-auto px-3">
                <div className="sticky top-0 z-10 bg-sidebar py-2">
                  <p className="text-[11px] text-muted-foreground px-3 uppercase tracking-wider">{isArabic ? "الأخيرة" : "Recent"}</p>
                </div>
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-4">{isArabic ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
                ) : (
                  <div className="space-y-1.5">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => { onSelectConversation?.(conv.id); onClose(); }}
                        className={`unlock-chip w-full text-left px-4 py-3 rounded-2xl text-sm truncate transition-colors ${
                          activeConversationId === conv.id
                            ? "border-primary/30 text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        {conv.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!showRecent && <div className="flex-1" />}

            {/* Separator */}
            <div className="mx-3 border-t border-sidebar-border" />

            <div className="p-3 space-y-2">
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-sidebar-foreground">{isArabic ? "رصيد MC" : "MC Balance"}</span>
                  <span className="text-xs text-muted-foreground">{credits.toFixed(0)}</span>
                </div>
                <div className="w-full h-2 bg-sidebar-accent rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { navigate("/settings"); onClose(); }}
                  className="unlock-chip flex-1 flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors"
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
                    <p className="text-[11px] text-muted-foreground truncate">{userEmail || (isArabic ? "الخطة المجانية" : "Free Plan")}</p>
                  </div>
                </button>
                <button
                  onClick={() => { navigate("/pricing"); onClose(); }}
                  className="unlock-chip p-3 rounded-2xl text-primary transition-colors"
                  title={isArabic ? "ترقية" : "Upgrade"}
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
