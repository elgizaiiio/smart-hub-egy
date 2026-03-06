import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
}

const AppSidebar = ({ open, onClose, onNewChat, onSelectConversation, activeConversationId }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (open) loadConversations();
  }, [open]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at, mode")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  };

  const services = [
    { path: "/", label: "Chat" },
    { path: "/images", label: "Images" },
    { path: "/videos", label: "Videos" },
    { path: "/code", label: "Programming" },
    { path: "/files", label: "Files" },
  ];

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
                onClick={() => { onNewChat(); onClose(); navigate("/"); }}
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
              {/* Credits */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-sidebar-foreground">Credits</span>
                  <span className="text-xs text-muted-foreground">0</span>
                </div>
                <div className="w-full h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: "0%" }} />
                </div>
              </div>

              {/* User */}
              <button
                onClick={() => { navigate("/settings"); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-sidebar-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sidebar-foreground truncate">User</p>
                  <p className="text-[11px] text-muted-foreground truncate">0 credits</p>
                </div>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
