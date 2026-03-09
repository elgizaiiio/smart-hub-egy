import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Image, Film, Code2, FileText, Settings, LogOut, Coins, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DesktopSidebarProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const navItems = [
  { path: "/", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Image", icon: Image },
  { path: "/videos", label: "Video", icon: Film },
  { path: "/code", label: "Code", icon: Code2 },
  { path: "/files", label: "Files", icon: FileText },
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

  return (
    <aside className="hidden md:flex flex-col items-center w-[72px] h-[100dvh] bg-sidebar border-r border-sidebar-border shrink-0 py-3">
      {/* Logo */}
      <button
        onClick={() => { onNewChat?.(); navigate("/"); }}
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 hover:opacity-80 transition-opacity"
      >
        <img src={logo} alt="Megsy" className="w-8 h-8 object-contain pointer-events-auto" />
      </button>

      {/* Navigation - Main */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group w-full flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-0.5 w-full px-2">
        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all">
              <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={1.8} />
              <span className="leading-none">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-44">
            <DropdownMenuItem onClick={() => window.open("https://api.smarthubing.com", "_blank")}>
              API
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://status.smarthubing.com", "_blank")}>
              Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://about.smarthubing.com", "_blank")}>
              About
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/referrals")}>
              Referrals
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
            location.pathname.startsWith("/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
          }`}
        >
          <Settings className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className="leading-none">Settings</span>
        </button>

        {/* Credits */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>{credits.toFixed(0)}</span>
        </button>

        {/* Separator */}
        <div className="w-8 border-t border-sidebar-border my-1" />

        {/* User Avatar */}
        <button
          onClick={() => navigate("/settings/profile")}
          className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-sidebar-ring/40 transition-all"
          title={userName}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover pointer-events-auto" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
              {initial}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
