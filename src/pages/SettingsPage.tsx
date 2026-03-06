import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState("en");

  const languages = [
    { code: "en", label: "English" },
    { code: "ar", label: "Arabic" },
    { code: "fr", label: "French" },
    { code: "es", label: "Spanish" },
    { code: "de", label: "German" },
    { code: "pt", label: "Portuguese" },
    { code: "zh", label: "Chinese" },
    { code: "ja", label: "Japanese" },
    { code: "ko", label: "Korean" },
    { code: "ru", label: "Russian" },
    { code: "tr", label: "Turkish" },
    { code: "hi", label: "Hindi" },
  ];

  const integrations = [
    "Supabase", "GitHub", "Google Drive", "Slack", "Notion",
    "Discord", "Figma", "Linear", "Vercel", "Stripe",
  ];

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-10 h-5.5 rounded-full transition-colors relative ${on ? "bg-foreground/80" : "bg-secondary"}`}
    >
      <div className={`w-4.5 h-4.5 rounded-full bg-background absolute top-0.5 transition-transform ${on ? "translate-x-5 left-0" : "left-0.5"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center px-4 md:px-6 h-14 border-b border-border">
        <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-lg text-foreground">Settings</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* AI Customization */}
          <section className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground">AI Customization</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-foreground">Response Style</p>
                  <p className="text-xs text-muted-foreground">Adjust how AI responds to you</p>
                </div>
                <select className="bg-secondary text-sm text-foreground rounded-lg px-3 py-1.5 border border-border outline-none">
                  <option>Balanced</option>
                  <option>Creative</option>
                  <option>Precise</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm text-foreground">Memory</p>
                  <p className="text-xs text-muted-foreground">AI remembers previous conversations</p>
                </div>
                <Toggle on={true} onToggle={() => {}} />
              </div>
            </div>
          </section>

          {/* App Integrations */}
          <section className="glass-panel p-6 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">App Integrations</h3>
            <div className="space-y-0.5">
              {integrations.map((name) => (
                <div key={name} className="flex items-center justify-between py-2.5 px-1">
                  <span className="text-sm text-foreground">{name}</span>
                  <button className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-lg bg-secondary transition-colors">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Appearance */}
          <section className="glass-panel p-6 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Appearance</h3>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle light/dark theme</p>
              </div>
              <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            </div>
            <div>
              <p className="text-sm text-foreground mb-2">Accent Color</p>
              <div className="flex gap-2">
                {["220 10% 75%", "200 80% 55%", "280 70% 55%", "340 70% 55%", "160 60% 45%", "30 80% 55%"].map((c) => (
                  <button
                    key={c}
                    className="w-7 h-7 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
                    style={{ background: `hsl(${c})` }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Language */}
          <section className="glass-panel p-6 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">Language</h3>
            <p className="text-xs text-muted-foreground">Interface language (AI will auto-detect your language)</p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-secondary text-sm text-foreground rounded-lg px-3 py-2.5 border border-border outline-none"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </section>

          {/* Security */}
          <section className="glass-panel p-6 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">Security</h3>
            <button className="text-sm text-foreground hover:text-muted-foreground transition-colors flex items-center justify-between w-full py-2">
              Change Password
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </section>

          {/* Danger */}
          <section className="glass-panel p-6 border-destructive/20">
            <h3 className="font-display text-sm font-semibold text-destructive mb-3">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mb-4">Permanently delete your account and all data.</p>
            <button className="px-4 py-2 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
              Delete Account
            </button>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
