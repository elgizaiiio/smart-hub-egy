import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard } from "lucide-react";
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
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (open) {
      loadConversations();
      loadUserInfo();
    }
  }, [open, currentMode]);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
      setUserEmail(user.email || "");
      // Load credits from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (profile) {
        setCredits(Number(profile.credits) || 0);
      }
    }
  };

  const loadConversations = async () => {
    const modeFilter = currentMode === "chat" ? "chat" :
      currentMode === "images" ? "images" :
      currentMode === "videos" ? "videos" :
      currentMode === "files" ? "files" :
      currentMode === "code" ? "code" : "chat";

    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at, mode")
      .eq("mode", modeFilter)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (data) setConversations(data);
  };

  const services = [
    { path: "/", label: "Chat" },
    { path: "/images", label: "Images" },
    { path: "/videos", label: "Videos" },
    { path: "/code", label: "Programming" },
    { path: "/files", label: "Files" },
  ];

  const initial = userName.charAt(0).toUpperCase();

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
            {/* New Chat */}
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
                {services.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      location.pathname === item.path
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <p className="text-[11px] text-muted-foreground px-3 py-2 uppercase tracking-wider">Recent</p>
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

            {/* Bottom */}
            <div className="p-3 space-y-2 border-t border-sidebar-border">
              {/* Credits bar */}
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-sidebar-foreground">Credits</span>
                  <span className="text-xs text-muted-foreground">{credits.toFixed(2)} MC</span>
                </div>
                <div className="w-full h-2 bg-sidebar-accent rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }} />
                </div>
              </div>

              {/* User */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { navigate("/settings"); onClose(); }}
                  className="flex-1 flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-sidebar-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                    {initial}
                  </div>
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
