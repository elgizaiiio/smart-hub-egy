import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ImageIcon, Video, Code2, FolderOpen, ChevronDown, Sparkles, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FancyButton from "@/components/FancyButton";

interface DesktopSidebarProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const DesktopSidebar = ({ onSelectConversation, onNewChat, activeConversationId }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  useEffect(() => { loadUserInfo(); }, []);

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
      const { data: convos } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(8);
      if (convos) setRecentChats(convos);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initial = userName.charAt(0).toUpperCase() || "U";
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const isImageMode = isActive("/images");
  const isVideoMode = isActive("/videos");

  const navLinkClass = (active: boolean) =>
    `px-4 py-1.5 text-[13px] font-medium rounded-full transition-all whitespace-nowrap ${
      active
        ? "bg-white/[0.12] text-white"
        : "text-white/50 hover:text-white/80"
    }`;

  return (
    <header className="hidden md:block w-full shrink-0 z-40">
      <div className="flex items-center justify-between h-[52px] px-5 bg-[hsl(0,0%,7%)] border-b border-white/[0.06]">

        {/* Left: Brand + Search */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => { onNewChat?.(); navigate("/chat"); }}
            className="text-[17px] font-black tracking-tight text-white italic hover:opacity-80 transition-opacity"
          >
            Megsy
          </button>

          {/* Search pill */}
          <div className="flex items-center gap-2 bg-white/[0.06] rounded-full px-3 py-1.5 border border-white/[0.08] w-[180px]">
            <Search className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[12px] text-white/30">Search</span>
          </div>
        </div>

        {/* Center: Navigation pills */}
        <nav className="flex items-center gap-1 bg-white/[0.04] rounded-full p-1 border border-white/[0.06]">
          {/* Chat with dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={navLinkClass(isActive("/chat"))}>
                Chat
                <ChevronDown className="w-3 h-3 ml-1 inline opacity-40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[hsl(0,0%,10%)] border-white/[0.08] text-white">
              <DropdownMenuItem onClick={() => { onNewChat?.(); navigate("/chat"); }} className="text-white/90 focus:text-white focus:bg-white/[0.08]">
                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                New Chat
              </DropdownMenuItem>
              {recentChats.length > 0 && <DropdownMenuSeparator className="bg-white/[0.08]" />}
              {recentChats.map((chat) => (
                <DropdownMenuItem
                  key={chat.id}
                  onClick={() => { onSelectConversation?.(chat.id); navigate("/chat"); }}
                  className="text-white/50 focus:text-white focus:bg-white/[0.08] text-[12px] truncate"
                >
                  {chat.title || "Untitled"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Toolkit — split Image/Video */}
          <div className={`flex items-center rounded-full overflow-hidden ${isImageMode || isVideoMode ? "bg-white/[0.12]" : ""}`}>
            <button
              onClick={() => navigate("/images")}
              className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium transition-all ${
                isImageMode
                  ? "bg-white/[0.15] text-white"
                  : isVideoMode
                  ? "text-white/60 hover:text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/[0.1]" />
            <button
              onClick={() => navigate("/videos")}
              className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium transition-all ${
                isVideoMode
                  ? "bg-white/[0.15] text-white"
                  : isImageMode
                  ? "text-white/60 hover:text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Files with dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={navLinkClass(isActive("/files"))}>
                Files
                <ChevronDown className="w-3 h-3 ml-1 inline opacity-40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-[hsl(0,0%,10%)] border-white/[0.08] text-white">
              <DropdownMenuItem onClick={() => navigate("/files")} className="text-white/90 focus:text-white focus:bg-white/[0.08]">
                <FolderOpen className="w-3.5 h-3.5 mr-2" />
                All Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Studio */}
          <button
            onClick={() => navigate(isVideoMode ? "/videos/studio" : "/images/studio")}
            className={navLinkClass(location.pathname.includes("/studio"))}
          >
            Studio
          </button>

          {/* Code */}
          <button
            onClick={() => navigate("/code")}
            className={navLinkClass(isActive("/code"))}
          >
            Code
          </button>
        </nav>

        {/* Right: Pricing + Subscribe + New + Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/pricing")}
            className="text-[13px] font-medium text-white/50 hover:text-white transition-colors"
          >
            Pricing
          </button>

          <button
            onClick={() => { onNewChat?.(); navigate("/chat"); }}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors border border-white/[0.06]"
          >
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
          </button>

          <FancyButton onClick={() => navigate("/pricing")} className="!h-8 !text-[12px] !px-5 !rounded-full">
            Subscribe Now
          </FancyButton>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/[0.1] hover:ring-white/[0.3] transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-white/60">
                    {initial}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[hsl(0,0%,10%)] border-white/[0.08] text-white">
              <DropdownMenuItem onClick={() => navigate("/settings/profile")} className="text-white/80 focus:text-white focus:bg-white/[0.08]">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="text-white/80 focus:text-white focus:bg-white/[0.08]">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem className="text-white/50 focus:bg-white/[0.08] text-[12px]">
                <span className="tabular-nums">{credits.toFixed(0)} MC</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-white/[0.08]">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DesktopSidebar;
