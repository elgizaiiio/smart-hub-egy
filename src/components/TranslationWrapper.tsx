import { useState, useEffect, ReactNode } from "react";
import { Translator } from "@miracleufo/react-g-translator";

const RTL_LANGUAGES = ["ar", "he"];

interface TranslationWrapperProps {
  children: ReactNode;
}

const TranslationWrapper = ({ children }: TranslationWrapperProps) => {
  const [lang, setLang] = useState(() => localStorage.getItem("language") || "en");

  useEffect(() => {
    const handleStorage = () => {
      const newLang = localStorage.getItem("language") || "en";
      setLang(newLang);
    };

    // Listen for storage events (from other tabs) and custom event (same tab)
    window.addEventListener("storage", handleStorage);
    window.addEventListener("languagechange-custom", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("languagechange-custom", handleStorage);
    };
  }, []);

  // RTL support
  useEffect(() => {
    const isRtl = RTL_LANGUAGES.includes(lang);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  if (lang === "en") {
    return <>{children}</>;
  }

  return (
    <Translator from="en" to={lang}>
      {children}
    </Translator>
  );
};

export default TranslationWrapper;
