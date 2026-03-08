import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Check, User, Bot, MessageSquare, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";


const themes = [
  { id: "dark", label: "Pitch Black", desc: "True black", colors: ["#000000", "#0d0d0d", "#1a1a1a"] },
  { id: "ocean", label: "Midnight Blue", desc: "Deep navy", colors: ["#0d1117", "#151d2b", "#1c2636"] },
  { id: "light", label: "Light", desc: "Clean & bright", colors: ["#f7f7f7", "#eeeeee", "#e0e0e0"] },
  { id: "sunset", label: "Warm Sand", desc: "Earthy tones", colors: ["#f2ede8", "#e8e0d6", "#ddd4c8"] },
  { id: "rosegold", label: "Rose Gold", desc: "Luxury pink", colors: ["#1a0d12", "#241419", "#2e1a21"] },
  { id: "forest", label: "Forest", desc: "Dark calm", colors: ["#0a1a12", "#112118", "#17291f"] },
  { id: "amoled", label: "Amoled Purple", desc: "Deep violet", colors: ["#0d0818", "#140e22", "#1a132c"] },
];

const accentColors = [
  { hsl: "262 60% 55%", hex: "#7c5cfc" },
  { hsl: "210 80% 55%", hex: "#3b82f6" },
  { hsl: "142 50% 50%", hex: "#22c55e" },
  { hsl: "330 70% 55%", hex: "#ec4899" },
  { hsl: "25 90% 55%", hex: "#f97316" },
  { hsl: "160 60% 45%", hex: "#14b8a6" },
  { hsl: "0 70% 55%", hex: "#ef4444" },
  { hsl: "270 60% 55%", hex: "#8b5cf6" },
  { hsl: "180 60% 45%", hex: "#06b6d4" },
  { hsl: "45 90% 50%", hex: "#eab308" },
  { hsl: "150 60% 40%", hex: "#10b981" },
  { hsl: "340 80% 55%", hex: "#f43f5e" },
];

const chatStyles = [
  { id: "modern", label: "Modern", desc: "Rounded bubbles" },
  { id: "classic", label: "Classic", desc: "Square corners" },
  { id: "minimal", label: "Minimal", desc: "No background" },
];

const fontSizeLabels = ["Small", "Medium", "Large"];

const CustomizationPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [currentAccent, setCurrentAccent] = useState(() => localStorage.getItem("accent") || "262 60% 55%");
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved ? parseInt(saved) : 1;
  });
  const [chatStyle, setChatStyle] = useState(() => localStorage.getItem("chatStyle") || "modern");

  useEffect(() => {
    const sizes = ["14px", "16px", "18px"];
    document.documentElement.style.setProperty("--font-size-base", sizes[fontSize]);
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const handleThemeChange = useCallback((id: string) => {
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("theme", id);
    setCurrentTheme(id);
  }, []);

  const handleAccentChange = useCallback((hsl: string) => {
    document.documentElement.style.setProperty("--primary", hsl);
    localStorage.setItem("accent", hsl);
    setCurrentAccent(hsl);
  }, []);

  const handleChatStyleChange = useCallback((id: string) => {
    localStorage.setItem("chatStyle", id);
    setChatStyle(id);
  }, []);

  const getBubbleClasses = (isUser: boolean) => {
    const base = "px-3.5 py-2 max-w-[70%]";
    if (chatStyle === "modern") {
      return `${base} ${isUser ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`;
    }
    if (chatStyle === "classic") {
      return `${base} rounded-md`;
    }
    return `${base} rounded-none border-l-2 ${isUser ? "border-primary" : "border-muted-foreground/30"}`;
  };

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-md mx-auto pb-8">
      {/* Theme Selection */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Theme</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleThemeChange(t.id)}
                className={`relative rounded-2xl p-3 transition-all ${
                  isSelected ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/30"
                }`}
              >
                <div
                  className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5"
                  style={{ background: t.colors[0] }}
                >
                  <div className="p-2 space-y-1.5">
                    <div className="h-2 w-8 rounded-full" style={{ background: t.colors[2] }} />
                    <div className="h-1.5 w-full rounded-full" style={{ background: t.colors[1] }} />
                    <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.colors[1] }} />
                    <div className="h-1.5 w-1/2 rounded-full" style={{ background: t.colors[1] }} />
                    <div className="mt-2 flex justify-end">
                      <div
                        className="h-2.5 w-12 rounded-full"
                        style={{ background: `hsl(${currentAccent})` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium text-foreground">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3.5 h-3.5 rounded-full" style={{ background: `hsl(${currentAccent})` }} />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Accent Color</p>
        </div>

        {/* Chat Preview */}
        <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 mb-5 space-y-3">
          <div className="flex items-end gap-2 justify-end">
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground mb-1">You · 2:14 PM</p>
              <div
                className={getBubbleClasses(true)}
                style={{ background: chatStyle === "minimal" ? "transparent" : `hsl(${currentAccent})` }}
              >
                <p className={`text-[13px] ${chatStyle === "minimal" ? "text-foreground" : "text-white"}`}>
                  Hey! How's it going? 👋
                </p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
          </div>
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground mb-1">AI · 2:14 PM</p>
              <div
                className={`${getBubbleClasses(false)} ${chatStyle === "minimal" ? "bg-transparent" : "bg-muted"}`}
              >
                <p className="text-[13px] text-foreground">Pretty good, thanks! What can I help you with? ✨</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {accentColors.map(c => {
            const isSelected = currentAccent === c.hsl;
            return (
              <motion.button
                key={c.hex}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.15 }}
                onClick={() => handleAccentChange(c.hsl)}
                className={`w-9 h-9 rounded-full transition-shadow flex items-center justify-center ${
                  isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""
                }`}
                style={{
                  background: c.hex,
                  ...(isSelected ? { boxShadow: `0 0 14px ${c.hex}50` } : {}),
                }}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Font Size</p>
        </div>
        <div className="rounded-2xl bg-muted/30 border border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-muted-foreground">A</span>
            <span className="text-xs font-medium text-foreground">{fontSizeLabels[fontSize]}</span>
            <span className="text-base text-muted-foreground font-bold">A</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={0}
            max={2}
            step={1}
          />
        </div>
      </div>

      {/* Chat Bubble Style */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Chat Style</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {chatStyles.map(s => {
            const isSelected = chatStyle === s.id;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleChatStyleChange(s.id)}
                className={`relative rounded-xl p-3 text-center transition-all ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : "ring-1 ring-border hover:ring-primary/30"
                }`}
              >
                {/* Mini bubble preview */}
                <div className="flex flex-col items-center gap-1.5 mb-2">
                  <div
                    className={`h-2.5 w-10 ${
                      s.id === "modern" ? "rounded-full" : s.id === "classic" ? "rounded-sm" : "rounded-none border-l-2 border-primary"
                    }`}
                    style={{ background: s.id !== "minimal" ? `hsl(${currentAccent})` : "transparent" }}
                  />
                  <div
                    className={`h-2.5 w-8 bg-muted ${
                      s.id === "modern" ? "rounded-full" : s.id === "classic" ? "rounded-sm" : "rounded-none border-l-2 border-muted-foreground/30"
                    }`}
                  />
                </div>
                <p className="text-[11px] font-medium text-foreground">{s.label}</p>
                <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Customization" subtitle="Personalize your experience">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-12">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Customization</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default CustomizationPage;
