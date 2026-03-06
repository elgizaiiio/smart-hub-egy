import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Globe, Paintbrush, User, CreditCard, Gift, Code, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const themes = [
  { id: "light", label: "Light", preview: "bg-white" },
  { id: "dark", label: "Dark", preview: "bg-gray-900" },
  { id: "ocean", label: "Ocean", preview: "bg-blue-900" },
  { id: "sunset", label: "Sunset", preview: "bg-orange-900" },
];

const accentColors = [
  { id: "purple", hsl: "262 60% 55%", label: "Purple" },
  { id: "blue", hsl: "210 80% 55%", label: "Blue" },
  { id: "green", hsl: "142 50% 50%", label: "Green" },
  { id: "orange", hsl: "25 90% 55%", label: "Orange" },
  { id: "pink", hsl: "330 70% 55%", label: "Pink" },
  { id: "red", hsl: "0 70% 55%", label: "Red" },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const handleThemeChange = (themeId: string) => {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("theme", themeId);
    setCurrentTheme(themeId);
  };

  const sections = [
    {
      title: "PREFERENCES",
      items: [
        { icon: Globe, label: "Language", path: "" },
        { icon: Paintbrush, label: "Customization", path: "/settings/customization" },
      ],
    },
    {
      title: "ACCOUNT & BILLING",
      items: [
        { icon: User, label: "Profile", path: "/settings/profile" },
        { icon: CreditCard, label: "Billing", path: "/settings/billing" },
        { icon: Gift, label: "Referrals", path: "/settings/referrals" },
        { icon: Code, label: "APIs", path: "/settings/apis" },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { icon: Activity, label: "Status Page", path: "/status" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Settings</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4">
          {/* User */}
          <button
            onClick={() => navigate("/settings/profile")}
            className="w-full flex items-center gap-3 py-4 border-b border-border"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              U
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">User</p>
              <p className="text-xs text-muted-foreground">user@email.com</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {sections.map((section) => (
            <div key={section.title} className="py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider py-2">{section.title}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => item.path && navigate(item.path)}
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
