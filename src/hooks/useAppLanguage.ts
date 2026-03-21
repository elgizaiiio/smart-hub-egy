import { useEffect, useState } from "react";

const RTL_LANGUAGES = ["ar", "he"];

const getLanguage = () => {
  if (typeof window === "undefined") return "en";
  return document.documentElement.lang || localStorage.getItem("language") || "en";
};

export const useAppLanguage = () => {
  const [language, setLanguage] = useState(getLanguage);

  useEffect(() => {
    const sync = () => setLanguage(getLanguage());

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "dir"],
    });

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "language") sync();
    };

    window.addEventListener("languagechange-custom", sync);
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("languagechange-custom", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return {
    language,
    isArabic: RTL_LANGUAGES.includes(language),
    isRtl: RTL_LANGUAGES.includes(language),
  };
};