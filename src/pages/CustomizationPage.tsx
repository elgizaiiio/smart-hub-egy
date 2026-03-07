import { useState, useCallback } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const themes = [
  { id: "light", label: "Light", colors: ["#ffffff", "#f5f5f5", "#e5e5e5"] },
  { id: "white", label: "Pure White", colors: ["#fafafa", "#f0f0f0", "#e0e0e0"] },
  { id: "dark", label: "Dark", colors: ["#1a1a2e", "#16213e", "#0f3460"] },
  { id: "oled", label: "OLED", colors: ["#000000", "#0a0a0a", "#111111"] },
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
      {/* Theme Selection */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">Theme</p>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`relative rounded-2xl p-3 transition-all ${
                  isSelected ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/30"
                }`}
              >
                {/* Mini mockup */}
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
                {isSelected && (
                  <motion.div
                    layoutId="theme-indicator"
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">Accent Color</p>

        {/* Chat Preview */}
        <div className="rounded-2xl bg-muted/30 p-4 mb-5 space-y-2.5">
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[65%]" style={{ background: `hsl(${currentAccent})` }}>
              <p className="text-white text-[13px]">Hey! How's it going?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-3.5 py-2 bg-muted max-w-[65%]">
              <p className="text-[13px] text-foreground">Pretty good, thanks!</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {accentColors.map(c => {
            const isSelected = currentAccent === c.hsl;
            return (
              <button
                key={c.hex}
                onClick={() => handleAccentChange(c.hsl)}
                className={`w-9 h-9 rounded-full transition-all hover:scale-110 flex items-center justify-center ${
                  isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""
                }`}
                style={{
                  background: c.hex,
                  ...(isSelected ? { boxShadow: `0 0 14px ${c.hex}50` } : {}),
                }}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
              </button>
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
