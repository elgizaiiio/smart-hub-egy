import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ImageIcon, Video, Code2, FolderOpen, Crown, Layers, Bot, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DesktopSidebarProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const mainNav = [
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Images", icon: ImageIcon, subItems: [
    { path: "/images/studio", label: "Studio", icon: Layers },
    { path: "/images/agent", label: "Agent", icon: Bot },
  ]},
  { path: "/videos", label: "Videos", icon: Video, subItems: [
    { path: "/videos/studio", label: "Studio", icon: Layers },
    { path: "/videos/agent", label: "Agent", icon: Bot },
  ]},
  { path: "/code", label: "Code", icon: Code2 },
  { path: "/files", label: "Files", icon: FolderOpen },
];

const DesktopSidebar = ({ onSelectConversation, onNewChat, activeConversationId }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const emailPrefix = user.email?.split("@")[0] || "User";
      setUserName(user.user_metadata?.full_name || emailPrefix);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initial = userName.charAt(0).toUpperCase() || "U";

  const isActive = (path: string) => location.pathname === path;
  const isInSection = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Find active section with sub-items
  const activeSection = mainNav.find(item => item.subItems && isInSection(item.path));

  return (
    <header className="hidden md:flex flex-col w-full shrink-0 bg-background border-b border-border z-40">
      {/* Main navbar */}
      <div className="flex items-center justify-between h-12 px-4">
        {/* Left: Brand */}
        <button
          onClick={() => { onNewChat?.(); navigate("/chat"); }}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity shrink-0"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-base font-bold tracking-tight text-foreground">
            Megsy
          </span>
        </button>

        {/* Center: Nav items */}
        <nav className="flex items-center gap-1">
          {mainNav.map((item) => {
            const inSection = isInSection(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  inSection
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Credits + Upgrade + User */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Credits */}
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <span className="text-[11px] font-semibold tabular-nums">{credits.toFixed(0)} MC</span>
          </button>

          {/* Upgrade */}
          <button
            onClick={() => navigate("/pricing")}
            className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <Crown className="w-3 h-3" />
            Pro
          </button>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-border hover:ring-primary/50 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary">
                    {initial}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sub-navigation bar (Studio/Agent) */}
      {activeSection && activeSection.subItems && (
        <div className="flex items-center gap-1 px-4 h-9 border-t border-border/50 bg-muted/30">
          {activeSection.subItems.map(sub => (
            <button
              key={sub.path}
              onClick={() => navigate(sub.path)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                isActive(sub.path)
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <sub.icon className="w-3 h-3" />
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default DesktopSidebar;
