import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Image, Film, Code2, FileText, Settings, Coins, MoreHorizontal, Heart, FileCode, ChevronDown } from "lucide-react";
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

const mainNav = [
  { path: "/", label: "Home", icon: Home },
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

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const NavItem = ({ path, label, icon: Icon, badge }: { path: string; label: string; icon: any; badge?: string }) => {
    const active = isActive(path);
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full flex flex-col items-center gap-1.5 py-2 rounded-xl text-[11px] font-medium transition-all relative ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
        }`}
      >
        {badge && (
          <span className="absolute -top-1 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white leading-none">
            {badge}
          </span>
        )}
        <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
        <span className="leading-none">{label}</span>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col items-center w-[72px] h-[100dvh] bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <button
        onClick={() => { onNewChat?.(); navigate("/"); }}
        className="w-full flex items-center justify-center py-4 hover:opacity-80 transition-opacity"
      >
        <span className="text-2xl font-bold text-primary">M</span>
      </button>

      {/* Main Navigation */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-1.5">
        {mainNav.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-0.5 w-full px-1.5 pb-2">
        {/* Plans */}
        <NavItem path="/pricing" label="Plans" icon={Heart} />

        {/* API */}
        <button
          onClick={() => window.open("https://api.smarthubing.com", "_blank")}
          className="w-full flex flex-col items-center gap-1.5 py-2 rounded-xl text-[11px] font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all"
        >
          <FileCode className="w-5 h-5" strokeWidth={1.5} />
          <span className="leading-none">API</span>
        </button>

        {/* More */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex flex-col items-center gap-1.5 py-2 rounded-xl text-[11px] font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all">
              <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
              <span className="leading-none">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-44">
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
        <NavItem path="/settings" label="Settings" icon={Settings} />

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

        {/* User Avatar + Chevron */}
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
