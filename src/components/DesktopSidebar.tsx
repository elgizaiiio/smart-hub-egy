import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  { path: "/", label: "Chat" },
  { path: "/images", label: "Images" },
  { path: "/videos", label: "Videos" },
  { path: "/code", label: "Code" },
  { path: "/files", label: "Files" },
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

  return (
    <aside className="hidden md:flex flex-col w-[200px] h-[100dvh] bg-sidebar/60 backdrop-blur-xl border-r border-sidebar-border/30 shrink-0">
      {/* Brand */}
      <button
        onClick={() => { onNewChat?.(); navigate("/"); }}
        className="px-5 pt-6 pb-8 text-left hover:opacity-70 transition-opacity"
      >
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          Mira
        </span>
      </button>

      {/* Navigation */}
      <nav className="flex flex-col px-3 gap-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "text-sidebar-foreground bg-sidebar-accent/60 backdrop-blur-sm"
                  : "text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom */}
      <div className="flex flex-col px-3 pb-4 gap-2">
        {/* Credits */}
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
        >
          <span className="text-[12px] font-medium">Credits</span>
          <span className="text-[13px] font-semibold tabular-nums text-sidebar-foreground/70">
            {credits.toFixed(0)}
          </span>
        </button>

        {/* Upgrade */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-full px-3 py-2 rounded-lg text-[12px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-center"
        >
          Upgrade to Pro
        </button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors w-full">
              <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-sidebar-border/50 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/15 flex items-center justify-center text-[11px] font-semibold text-primary">
                    {initial}
                  </div>
                )}
              </div>
              <span className="text-[12px] font-medium text-sidebar-foreground/70 truncate">
                {userName}
              </span>
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
