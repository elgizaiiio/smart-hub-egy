import { useState, useMemo } from "react";
import { ArrowLeft, Check, Search, Globe, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
];

const LanguagePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentLang, setCurrentLang] = useState(localStorage.getItem("language") || "en");
  const [search, setSearch] = useState("");

  const currentLangData = LANGUAGES.find((l) => l.code === currentLang);

  const filtered = useMemo(
    () =>
      LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.native.includes(search)
      ),
    [search]
  );

  const handleSelect = (code: string) => {
    localStorage.setItem("language", code);
    setCurrentLang(code);
    window.dispatchEvent(new Event("languagechange-custom"));
  };

  const LanguageContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5 max-w-lg"
    >
      {/* Current language hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5">
        <div className="absolute top-3 right-3 opacity-10">
          <Globe className="w-20 h-20 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="notranslate w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl">
            {currentLangData?.flag}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Current Language
            </p>
            <p className="notranslate text-lg font-bold text-foreground truncate">
              {currentLangData?.name}
            </p>
            <p className="notranslate text-sm text-muted-foreground">
              {currentLangData?.native}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search languages..."
          className="w-full bg-secondary/50 backdrop-blur-sm rounded-xl pl-10 pr-4 py-3 text-sm text-foreground outline-none border border-border/50 focus:border-primary/50 focus:bg-secondary transition-all duration-200"
        />
      </div>

      {/* Language grid */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((lang, i) => {
            const isActive = currentLang === lang.code;
            return (
              <motion.button
                key={lang.code}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.3) }}
                onClick={() => handleSelect(lang.code)}
                className={`notranslate w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 border border-primary/25"
                    : "hover:bg-accent/50 border border-transparent"
                }`}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                    {lang.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{lang.native}</p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No languages found</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Language" subtitle="Choose your preferred language">
        <LanguageContent />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/settings")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Language</h1>
        </div>
        <div className="px-4 pb-8">
          <LanguageContent />
        </div>
      </div>
    </div>
  );
};

export default LanguagePage;
