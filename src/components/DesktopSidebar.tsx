import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Image, Film, Code2, FolderOpen, Coins, ChevronDown } from "lucide-react";
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
  { path: "/", label: "Chat", icon: MessageSquare },
  { path: "/images", label: "Images", icon: Image },
  { path: "/videos", label: "Videos", icon: Film },
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
      <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-3">
        {/* Credits */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all"
        >
          <Coins className="w-4 h-4" />
          <span>{credits.toFixed(0)}</span>
        </button>

        {/* Upgrade Button */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-[56px] py-1.5 rounded-lg text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upgrade
        </button>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-0.5 mt-1 group">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-sidebar-ring/40 transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover pointer-events-auto" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                    {initial}
                  </div>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors" />
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
