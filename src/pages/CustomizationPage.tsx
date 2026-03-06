import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const themes = [
  { id: "light", label: "Light", color: "#ffffff", border: "#e5e5e5" },
  { id: "dark", label: "Dark", color: "#121212", border: "#333" },
  { id: "ocean", label: "Ocean", color: "#0c1929", border: "#1e3a5f" },
  { id: "sunset", label: "Sunset", color: "#1a0f0a", border: "#3d2517" },
];

const accentColors = [
  { hsl: "262 60% 55%", hex: "#7c5cfc", label: "Purple" },
  { hsl: "210 80% 55%", hex: "#3b82f6", label: "Blue" },
  { hsl: "142 50% 50%", hex: "#22c55e", label: "Green" },
  { hsl: "25 90% 55%", hex: "#f97316", label: "Orange" },
  { hsl: "330 70% 55%", hex: "#ec4899", label: "Pink" },
  { hsl: "0 70% 55%", hex: "#ef4444", label: "Red" },
  { hsl: "45 90% 50%", hex: "#eab308", label: "Yellow" },
  { hsl: "180 60% 45%", hex: "#14b8a6", label: "Teal" },
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
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Customization</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-8">
          {/* Theme */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
            <div className="grid grid-cols-4 gap-3">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`aspect-square rounded-xl border-2 transition-all ${
                    currentTheme === t.id ? "border-primary scale-105" : "border-transparent"
                  }`}
                  style={{ background: t.color, borderColor: currentTheme === t.id ? undefined : t.border }}
                >
                  <span className="text-xs font-medium" style={{ color: t.id === "light" ? "#333" : "#fff" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Accent Color</p>
            <div className="grid grid-cols-4 gap-3">
              {accentColors.map(c => (
                <button
                  key={c.hex}
                  onClick={() => handleAccentChange(c.hsl)}
                  className={`h-12 rounded-xl transition-all ${currentAccent === c.hsl ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105" : ""}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomizationPage;
