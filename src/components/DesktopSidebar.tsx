import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ImagePlus, Clapperboard, TerminalSquare, FolderKanban, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const mainNav = [
  { path: "/", label: "Chat", icon: Sparkles },
  { path: "/images", label: "Images", icon: ImagePlus },
  { path: "/videos", label: "Videos", icon: Clapperboard },
  { path: "/code", label: "Code", icon: TerminalSquare },
  { path: "/files", label: "Files", icon: FolderKanban },
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

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const NavItem = ({ path, label, icon: Icon }: { path: string; label: string; icon: any }) => {
    const active = isActive(path);
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-medium transition-all ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
        }`}
      >
        <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2 : 1.5} />
        <span className="leading-none">{label}</span>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col items-center w-[72px] h-[100dvh] bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <button
        onClick={() => { onNewChat?.(); navigate("/"); }}
        className="w-full flex items-center justify-center py-5 hover:opacity-80 transition-opacity"
      >
        <span className="text-3xl font-extrabold bg-gradient-to-b from-[hsl(0,0%,85%)] to-[hsl(0,0%,55%)] bg-clip-text text-transparent drop-shadow-sm">M</span>
      </button>

      {/* Main Navigation */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-1.5">
        {mainNav.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex flex-col items-center w-full px-2 pb-4 gap-3">
        {/* Credits Display */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-[58px] text-center py-1 rounded-lg text-[11px] font-bold text-sidebar-foreground/80 hover:text-sidebar-foreground transition-all"
        >
          <span className="text-[18px] font-extrabold bg-gradient-to-b from-sidebar-foreground to-sidebar-foreground/50 bg-clip-text text-transparent leading-none">{credits.toFixed(0)}</span>
          <span className="block text-[9px] font-medium text-sidebar-foreground/40 mt-0.5">credits</span>
        </button>

        {/* Upgrade Button */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-[58px] py-2 rounded-xl text-[10px] font-bold bg-gradient-to-b from-primary via-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
        >
          PRO ✦
        </button>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-1 group relative">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-sidebar-border group-hover:ring-primary/50 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {initial}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-sidebar" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-44">
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
    </aside>
  );
};

export default DesktopSidebar;
