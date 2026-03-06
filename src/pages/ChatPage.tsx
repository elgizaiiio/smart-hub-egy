import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Code2,
  FileText,
  Image,
  Video,
  Send,
  ChevronDown,
  Paperclip,
  Settings,
  User,
  CreditCard,
  LogOut,
  Sparkles,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

type Mode = "chat" | "code" | "files" | "images" | "videos";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

const MODELS: Record<Mode, ModelOption[]> = {
  chat: [
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
    { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
    { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta" },
  ],
  code: [
    { id: "grok-3", name: "Grok 3", provider: "xAI" },
  ],
  files: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  ],
  images: [
    { id: "flux-1.1-pro", name: "FLUX 1.1 Pro", provider: "BFL" },
    { id: "dall-e-3", name: "DALL-E 3", provider: "OpenAI" },
    { id: "stable-diffusion-3.5", name: "SD 3.5", provider: "Stability" },
    { id: "midjourney-v6", name: "Midjourney v6", provider: "Midjourney" },
    { id: "ideogram-v2", name: "Ideogram v2", provider: "Ideogram" },
    { id: "recraft-v3", name: "Recraft v3", provider: "Recraft" },
    { id: "playground-v3", name: "Playground v3", provider: "Playground" },
    { id: "leonardo-phoenix", name: "Leonardo Phoenix", provider: "Leonardo" },
    { id: "kandinsky-3", name: "Kandinsky 3", provider: "Sber" },
    { id: "imagen-3", name: "Imagen 3", provider: "Google" },
  ],
  videos: [
    { id: "kling-v2", name: "Kling v2", provider: "Kuaishou" },
    { id: "runway-gen3", name: "Gen-3 Alpha", provider: "Runway" },
    { id: "minimax-video-01", name: "Video-01", provider: "MiniMax" },
    { id: "luma-ray2", name: "Ray 2", provider: "Luma" },
    { id: "pika-v2", name: "Pika v2", provider: "Pika" },
    { id: "hailuo-video", name: "Hailuo", provider: "MiniMax" },
    { id: "sora-v1", name: "Sora", provider: "OpenAI" },
    { id: "veo-2", name: "Veo 2", provider: "Google" },
    { id: "cogvideox-5b", name: "CogVideoX", provider: "THUDM" },
    { id: "wan-video", name: "Wan Video", provider: "Alibaba" },
  ],
};

const MODE_ICONS: Record<Mode, React.ReactNode> = {
  chat: <MessageSquare className="w-4 h-4" />,
  code: <Code2 className="w-4 h-4" />,
  files: <FileText className="w-4 h-4" />,
  images: <Image className="w-4 h-4" />,
  videos: <Video className="w-4 h-4" />,
};

const MODE_LABELS: Record<Mode, string> = {
  chat: "Chat",
  code: "Code",
  files: "Files",
  images: "Images",
  videos: "Videos",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatPage = () => {
  const [mode, setMode] = useState<Mode>("chat");
  const [selectedModel, setSelectedModel] = useState(MODELS.chat[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSelectedModel(MODELS[newMode][0]);
    setShowModelDropdown(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "This is a placeholder response. Connect your API keys to enable real AI responses." },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <img src={logo} alt="egy" className="w-7 h-7" />
          <span className="font-display font-bold text-lg text-foreground">egy</span>
        </div>

        {/* Desktop Mode Tabs */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-secondary">
          {(Object.keys(MODELS) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`mode-chip ${mode === m ? "active" : ""}`}
            >
              {MODE_ICONS[m]}
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-panel p-1 z-50">
              <button
                onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => { navigate("/settings"); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => { navigate("/pricing"); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Subscription
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { navigate("/auth"); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-accent rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Mode Tabs */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-b border-border px-4 py-3"
        >
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODELS) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { handleModeChange(m); setShowMobileMenu(false); }}
                className={`mode-chip ${mode === m ? "active" : ""}`}
              >
                {MODE_ICONS[m]}
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-silver" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2 silver-gradient">
                What can I help you with?
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Choose a mode and start creating with AI
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: <MessageSquare className="w-4 h-4" />, label: "Start a conversation", mode: "chat" as Mode },
                  { icon: <Code2 className="w-4 h-4" />, label: "Write some code", mode: "code" as Mode },
                  { icon: <Image className="w-4 h-4" />, label: "Generate an image", mode: "images" as Mode },
                  { icon: <Video className="w-4 h-4" />, label: "Create a video", mode: "videos" as Mode },
                  { icon: <FileText className="w-4 h-4" />, label: "Analyze a file", mode: "files" as Mode },
                  { icon: <Plus className="w-4 h-4" />, label: "New project", mode: "code" as Mode },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleModeChange(item.mode)}
                    className="glass-panel p-4 text-left hover:border-silver-dark transition-colors group"
                  >
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                      {item.icon}
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-secondary text-foreground"
                      : "glass-panel text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Model Selector */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-secondary"
              >
                <span className="text-foreground font-medium">{selectedModel.name}</span>
                <span className="text-muted-foreground">{selectedModel.provider}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showModelDropdown && (
                <div className="absolute bottom-full mb-2 left-0 w-64 glass-panel p-1 z-50 max-h-64 overflow-y-auto">
                  {MODELS[mode].map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedModel.id === model.id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.provider}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Input Box */}
          <div className="glass-panel p-2 flex items-end gap-2">
            {(mode === "files" || mode === "images" || mode === "videos") && (
              <>
                <input ref={fileInputRef} type="file" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message egy ${MODE_LABELS[mode]}...`}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2 px-2 max-h-32"
              style={{ minHeight: "36px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-silver text-background hover:bg-silver-bright transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            egy may produce inaccurate information. Verify important details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
