import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Home,
  FolderCode,
  ImageIcon,
  MessageSquare,
  Settings,
  CreditCard,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  chatHistory?: ChatHistory[];
  onNewChat?: () => void;
  onSelectChat?: (id: string) => void;
}

const AppSidebar = ({ open, onClose, chatHistory = [], onNewChat, onSelectChat }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/chat" },
    { icon: FolderCode, label: "Projects", path: "/projects" },
    { icon: ImageIcon, label: "Studio", path: "/studio" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar z-50 flex flex-col border-r border-sidebar-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <img src={logo} alt="egy" className="w-6 h-6" />
                <span className="font-display font-bold text-foreground">egy</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat */}
            <div className="px-3 mb-2">
              <button
                onClick={() => { onNewChat?.(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground bg-sidebar-accent hover:bg-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Nav */}
            <nav className="px-3 space-y-0.5 mb-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.path)
                      ? "text-foreground bg-sidebar-accent font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3">
              <p className="text-xs text-muted-foreground px-3 mb-2 font-medium">Recent</p>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3">No conversations yet</p>
              ) : (
                <div className="space-y-0.5">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => { onSelectChat?.(chat.id); onClose(); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors truncate"
                    >
                      {chat.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom */}
            <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
              <button
                onClick={() => { navigate("/settings"); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/pricing"); onClose(); }}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-sidebar-accent"
                >
                  <CreditCard className="w-3 h-3" />
                </button>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
