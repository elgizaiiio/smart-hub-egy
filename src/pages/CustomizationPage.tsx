import { useState, useCallback } from "react";
import { ArrowLeft, Sun, Moon, Monitor, Zap, Check, Palette, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const themes = [
  { id: "light", label: "Light", icon: Sun, preview: "bg-white border border-border" },
  { id: "white", label: "Pure White", icon: Monitor, preview: "bg-[#fafafa] border border-border" },
  { id: "dark", label: "Dark", icon: Moon, preview: "bg-[#1a1a2e]" },
  { id: "oled", label: "OLED", icon: Zap, preview: "bg-black" },
];

const accentColors = [
  { hsl: "262 60% 55%", hex: "#7c5cfc", name: "Violet" },
  { hsl: "210 80% 55%", hex: "#3b82f6", name: "Blue" },
  { hsl: "142 50% 50%", hex: "#22c55e", name: "Green" },
  { hsl: "330 70% 55%", hex: "#ec4899", name: "Pink" },
  { hsl: "25 90% 55%", hex: "#f97316", name: "Orange" },
  { hsl: "160 60% 45%", hex: "#14b8a6", name: "Teal" },
  { hsl: "0 70% 55%", hex: "#ef4444", name: "Red" },
  { hsl: "270 60% 55%", hex: "#8b5cf6", name: "Purple" },
  { hsl: "180 60% 45%", hex: "#06b6d4", name: "Cyan" },
  { hsl: "45 90% 50%", hex: "#eab308", name: "Gold" },
  { hsl: "150 60% 40%", hex: "#10b981", name: "Emerald" },
  { hsl: "340 80% 55%", hex: "#f43f5e", name: "Rose" },
];

const CustomizationPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [currentAccent, setCurrentAccent] = useState(() => localStorage.getItem("accent") || "262 60% 55%");

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

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-md mx-auto">
      {/* Theme Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Theme</p>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {themes.map(t => {
            const isSelected = currentTheme === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  isSelected
                    ? "bg-primary/10 ring-1.5 ring-primary/40"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl ${t.preview} flex items-center justify-center transition-transform ${isSelected ? "scale-105" : ""}`}>
                  <Icon className={`w-5 h-5 ${t.id === "dark" || t.id === "oled" ? "text-white/70" : "text-neutral-600"}`} />
                </div>
                <span className="text-[11px] font-medium text-foreground">{t.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="theme-check"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Preview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Preview</p>
        </div>
        <div className="rounded-2xl bg-muted/30 p-4 space-y-3">
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%]" style={{ background: `hsl(${currentAccent})` }}>
              <p className="text-white text-[13px]">Hey, how does this look? ✨</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted max-w-[75%]">
              <p className="text-[13px] text-foreground">Looking great! Love the color.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accent Colors */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${currentAccent})` }} />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Accent Color</p>
        </div>
        <div className="grid grid-cols-6 gap-3 justify-items-center">
          {accentColors.map(c => {
            const isSelected = currentAccent === c.hsl;
            return (
              <button
                key={c.hex}
                onClick={() => handleAccentChange(c.hsl)}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
                    isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ background: c.hex, ...(isSelected ? { boxShadow: `0 0 12px ${c.hex}60` } : {}) }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                </div>
                <span className="text-[9px] text-muted-foreground">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Customization" subtitle="Personalize your experience with themes and colors">
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
