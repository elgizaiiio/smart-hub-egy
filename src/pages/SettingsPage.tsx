import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, Globe, Bell, Shield, Trash2, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={logo} alt="egy" className="w-7 h-7" />
          <span className="font-display font-bold text-lg text-foreground">Settings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Appearance */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Moon className="w-4 h-4 text-silver" />
              Appearance
            </h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Use dark theme across the app</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-silver" : "bg-secondary"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-background absolute top-0.5 transition-transform ${darkMode ? "translate-x-5.5 left-0" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-silver" />
              Language
            </h3>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="glass-input w-full"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-silver" />
              Notifications
            </h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates about your account</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? "bg-silver" : "bg-secondary"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-background absolute top-0.5 transition-transform ${notifications ? "translate-x-5.5 left-0" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-silver" />
              Security
            </h3>
            <button className="glass-button flex items-center gap-2">
              <Key className="w-4 h-4" />
              Change Password
            </button>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel p-6 border-destructive/30">
            <h3 className="font-display text-sm font-semibold text-destructive flex items-center gap-2 mb-4">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Permanently delete your account and all data. This action cannot be undone.
            </p>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
              Delete Account
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
