import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ImageIcon, Video, Code2, FolderOpen, Crown, ChevronDown, Sparkles } from "lucide-react";
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
  const isInSection = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Determine if we're in image or video mode for the AI Toolkit toggle
  const isImageMode = isInSection("/images");
  const isVideoMode = isInSection("/videos");
  const isAIToolkit = isImageMode || isVideoMode;

  return (
    <header className="hidden md:block w-full shrink-0 z-40">
      <div className="flex items-center justify-between h-12 px-5 bg-[hsl(0,0%,8%)] border-b border-[hsl(0,0%,15%)]">
        {/* Left: Brand */}
        <button
          onClick={() => { onNewChat?.(); navigate("/chat"); }}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity shrink-0 mr-6"
        >
          <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-[15px] font-bold tracking-tight text-white">
            Megsy
          </span>
        </button>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-0.5 flex-1 justify-center">
          {/* Chat — with recent chats dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  isInSection("/chat")
                    ? "bg-[hsl(0,0%,18%)] text-white"
                    : "text-[hsl(0,0%,55%)] hover:text-white"
                }`}
              >
                Chat
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[hsl(0,0%,12%)] border-[hsl(0,0%,20%)] text-white">
              <DropdownMenuItem onClick={() => { onNewChat?.(); navigate("/chat"); }} className="text-white/90 focus:text-white focus:bg-[hsl(0,0%,18%)]">
                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                New Chat
              </DropdownMenuItem>
              {recentChats.length > 0 && <DropdownMenuSeparator className="bg-[hsl(0,0%,20%)]" />}
              {recentChats.map(chat => (
                <DropdownMenuItem
                  key={chat.id}
                  onClick={() => { onSelectConversation?.(chat.id); navigate("/chat"); }}
                  className="text-white/60 focus:text-white focus:bg-[hsl(0,0%,18%)] text-[12px] truncate"
                >
                  {chat.title || "Untitled"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Toolkit — split toggle (Image / Video) like Artlist */}
          <div className={`flex items-center rounded-full ${isAIToolkit ? "bg-[hsl(0,0%,18%)]" : ""} overflow-hidden`}>
            <button
              onClick={() => navigate("/images")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium transition-all rounded-l-full ${
                isImageMode
                  ? "bg-[hsl(0,0%,22%)] text-white"
                  : isAIToolkit
                  ? "text-white/60 hover:text-white"
                  : "text-[hsl(0,0%,55%)] hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate("/videos")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium transition-all rounded-r-full ${
                isVideoMode
                  ? "bg-[hsl(0,0%,22%)] text-white"
                  : isAIToolkit
                  ? "text-white/60 hover:text-white"
                  : "text-[hsl(0,0%,55%)] hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Files — with dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  isInSection("/files")
                    ? "bg-[hsl(0,0%,18%)] text-white"
                    : "text-[hsl(0,0%,55%)] hover:text-white"
                }`}
              >
                Files
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-[hsl(0,0%,12%)] border-[hsl(0,0%,20%)] text-white">
              <DropdownMenuItem onClick={() => navigate("/files")} className="text-white/90 focus:text-white focus:bg-[hsl(0,0%,18%)]">
                <FolderOpen className="w-3.5 h-3.5 mr-2" />
                All Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Studio — links to active studio */}
          <button
            onClick={() => navigate(isVideoMode ? "/videos/studio" : "/images/studio")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              location.pathname.includes("/studio")
                ? "bg-[hsl(0,0%,18%)] text-white"
                : "text-[hsl(0,0%,55%)] hover:text-white"
            }`}
          >
            Studio
          </button>

          {/* Code */}
          <button
            onClick={() => navigate("/code")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              isInSection("/code")
                ? "bg-[hsl(0,0%,18%)] text-white"
                : "text-[hsl(0,0%,55%)] hover:text-white"
            }`}
          >
            Code
          </button>
        </nav>

        {/* Right: Pricing + Subscribe + Avatar */}
        <div className="flex items-center gap-3 shrink-0 ml-6">
          {/* Credits / Pricing */}
          <button
            onClick={() => navigate("/pricing")}
            className="text-[13px] font-medium text-[hsl(0,0%,55%)] hover:text-white transition-colors"
          >
            Pricing
          </button>

          {/* Sparkle / new */}
          <button
            onClick={() => { onNewChat?.(); navigate("/chat"); }}
            className="w-8 h-8 rounded-full bg-[hsl(0,0%,18%)] hover:bg-[hsl(0,0%,25%)] flex items-center justify-center transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Subscribe / FancyButton */}
          <FancyButton onClick={() => navigate("/pricing")} className="!h-8 !text-[12px] !px-4">
            Subscribe Now
          </FancyButton>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[hsl(0,0%,25%)] hover:ring-[hsl(var(--primary))] transition-all">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[hsl(0,0%,18%)] flex items-center justify-center text-[10px] font-semibold text-white/70">
                    {initial}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[hsl(0,0%,12%)] border-[hsl(0,0%,20%)] text-white">
              <DropdownMenuItem onClick={() => navigate("/settings/profile")} className="text-white/80 focus:text-white focus:bg-[hsl(0,0%,18%)]">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="text-white/80 focus:text-white focus:bg-[hsl(0,0%,18%)]">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[hsl(0,0%,20%)]" />
              <DropdownMenuItem className="text-white/60 focus:bg-[hsl(0,0%,18%)] text-[12px]">
                <span className="tabular-nums">{credits.toFixed(0)} MC</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[hsl(0,0%,20%)]" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-[hsl(0,0%,18%)]">
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
