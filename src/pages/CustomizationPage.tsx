import { useState, useCallback } from "react";
import { ArrowLeft, SunMedium, MoonStar, Check, CloudCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const realThemes = [
  { id: "light", label: "Light", desc: "Bright & clean", isDark: false },
  { id: "white", label: "Pure White", desc: "Maximum clarity", isDark: false },
  { id: "dark", label: "Dark", desc: "Easy on eyes", isDark: true },
  { id: "oled", label: "OLED Black", desc: "True black", isDark: true },
];

const messageColors = [
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
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Appearance</p>
        <div className="space-y-2">
          {realThemes.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  t.isDark ? "bg-[#0a0a0f]" : "bg-amber-50"
                }`}>
                  {t.isDark ? (
                    <MoonStar className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <SunMedium className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Accent Color</p>
        
        {/* Preview bubble */}
        <div className="flex gap-3 mb-5">
          <div className="rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[70%]" style={{ background: `hsl(${currentAccent})` }}>
            <p className="text-white text-sm">This is how your messages look</p>
          </div>
          <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-muted">
            <p className="text-sm text-foreground">And this is a reply</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center">
          {messageColors.map(c => {
            const isSelected = currentAccent === c.hsl;
            return (
              <button
                key={c.hex}
                onClick={() => handleAccentChange(c.hsl)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  isSelected ? "ring-2 ring-offset-2 ring-offset-background" : ""
                }`}
                style={{ background: c.hex, ...(isSelected ? { ringColor: c.hex } : {}) }}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sync info */}
      <div className="flex items-center gap-3 py-3 px-1">
        <CloudCog className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Preferences sync automatically across all your devices
        </p>
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
