import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DesktopSidebar from "@/components/DesktopSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const AppLayout = ({ children, onSelectConversation, onNewChat, activeConversationId }: AppLayoutProps) => {
  return (
    <div className="flex h-[100dvh] w-full bg-background">
      <DesktopSidebar
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        activeConversationId={activeConversationId}
      />
      <main className="flex-1 min-w-0 h-[100dvh]">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
