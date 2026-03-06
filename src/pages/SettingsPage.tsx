import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Globe, Paintbrush, Zap, User, CreditCard, Gift, Code, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const themes = [
  { id: "midnight", label: "Midnight", color: "220 15% 12%" },
  { id: "ocean", label: "Ocean", color: "200 80% 30%" },
  { id: "sunset", label: "Sunset", color: "25 90% 35%" },
  { id: "forest", label: "Forest", color: "142 50% 28%" },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "midnight"
  );

  const handleThemeChange = (themeId: string) => {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("theme", themeId);
    setCurrentTheme(themeId);
  };

  const settingsSections = [
    {
      title: "PREFERENCES",
      items: [
        { icon: Globe, label: "Language", onClick: () => {} },
        { icon: Paintbrush, label: "Customization", onClick: () => {} },
      ],
    },
    {
      title: "AGENT & INTEGRATIONS",
      items: [
        { icon: Zap, label: "Agent Connections", onClick: () => {} },
      ],
    },
    {
      title: "ACCOUNT & BILLING",
      items: [
        { icon: User, label: "Account", onClick: () => {} },
        { icon: CreditCard, label: "Billing", onClick: () => navigate("/pricing") },
        { icon: Gift, label: "Referrals", onClick: () => {} },
        { icon: Code, label: "APIs", onClick: () => {} },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { icon: Activity, label: "Status Page", onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Settings</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4">
          {/* User Profile */}
          <button className="w-full flex items-center gap-3 py-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              J
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">James</p>
              <p className="text-xs text-muted-foreground">elgizatok@gmail.com</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Theme Selector */}
          <div className="py-4 border-b border-border">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">THEME</p>
            <div className="flex gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    currentTheme === theme.id
                      ? "ring-2 ring-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ background: `hsl(${theme.color})` }}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Sections */}
          {settingsSections.map((section) => (
            <div key={section.title} className="py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-0 py-2">{section.title}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 py-3.5 text-left hover:bg-accent/50 rounded-lg transition-colors -mx-2 px-2"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-sm text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
