import { useState } from "react";
import { ArrowLeft, Sun, Moon, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const realThemes = [
  { id: "light", label: "Healthy Light", isDark: false },
  { id: "dark", label: "Healthy Dark", isDark: true },
  { id: "ocean", label: "Ocean", isDark: true },
  { id: "sunset", label: "Sunset Warm", isDark: true },
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
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem("theme") || "dark");
  const [currentAccent, setCurrentAccent] = useState(localStorage.getItem("accent") || "262 60% 55%");

  const handleThemeChange = (id: string) => {
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("theme", id);
    setCurrentTheme(id);
  };

  const handleAccentChange = (hsl: string) => {
    document.documentElement.style.setProperty("--primary", hsl);
    localStorage.setItem("accent", hsl);
    setCurrentAccent(hsl);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-12">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Make it yours</h1>
            <p className="text-sm text-muted-foreground">Personalize your experience with themes, colors, and backgrounds</p>
          </div>

          {/* Theme */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">THEME</p>
            <div className="grid grid-cols-2 gap-3">
              {realThemes.map(t => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`relative flex flex-col items-center justify-center py-6 rounded-xl border-2 transition-all ${
                      isSelected ? "border-primary" : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    {t.isDark ? <Moon className="w-8 h-8 text-muted-foreground mb-2" /> : <Sun className="w-8 h-8 text-muted-foreground mb-2" />}
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Color */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">MESSAGE COLOR</p>
            <div className="rounded-xl overflow-hidden mb-4" style={{ background: `hsl(${currentAccent})` }}>
              <p className="text-white text-sm font-medium px-5 py-3.5">This is how your messages will look</p>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {messageColors.map(c => {
                const isSelected = currentAccent === c.hsl;
                return (
                  <button
                    key={c.hex}
                    onClick={() => handleAccentChange(c.hsl)}
                    className="w-10 h-10 rounded-full mx-auto flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: c.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Your preferences are saved automatically</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomizationPage;
