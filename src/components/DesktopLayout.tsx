import { useIsMobile } from "@/hooks/use-mobile";
import DesktopSidebar from "@/components/DesktopSidebar";

interface DesktopLayoutProps {
  children: React.ReactNode;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
}

const DesktopLayout = ({ children, onNewChat, onSelectConversation, activeConversationId }: DesktopLayoutProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex w-full bg-background">
      <DesktopSidebar
        onNewChat={onNewChat}
        onSelectConversation={onSelectConversation}
        activeConversationId={activeConversationId}
      />
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default DesktopLayout;
