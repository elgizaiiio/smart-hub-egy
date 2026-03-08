import { useEffect, ReactNode } from "react";

const RTL_LANGUAGES = ["ar", "he"];

// Google Translate language codes mapping
const LANG_MAP: Record<string, string> = {
  en: "en", ar: "ar", es: "es", fr: "fr", de: "de", zh: "zh-CN",
  ja: "ja", ko: "ko", pt: "pt", ru: "ru", tr: "tr", hi: "hi",
  it: "it", nl: "nl", pl: "pl", sv: "sv", th: "th", vi: "vi",
  id: "id", uk: "uk", ro: "ro", el: "el", cs: "cs", hu: "hu",
  da: "da", fi: "fi", no: "no", he: "iw", ms: "ms", bn: "bn",
};

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

function triggerTranslate(langCode: string) {
  const gtLang = LANG_MAP[langCode] || langCode;

  // Use the Google Translate combo to switch language
  const trySwitch = () => {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = gtLang;
      select.dispatchEvent(new Event("change"));
    } else {
      // Retry after a short delay if widget not ready
      setTimeout(trySwitch, 500);
    }
  };

  if (langCode === "en") {
    // Reset to original
    const frame = document.querySelector<HTMLIFrameElement>(".goog-te-banner-frame");
    if (frame) {
      const closeBtn = frame.contentDocument?.querySelector<HTMLElement>(".goog-close-link");
      closeBtn?.click();
    }
    // Also try cookie reset
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
    window.location.reload();
    return;
  }

  trySwitch();
}

function initGoogleTranslate() {
  // Add the hidden div for Google Translate
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.display = "none";
    document.body.appendChild(div);
  }

  // Define the init function
  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
        includedLanguages: Object.values(LANG_MAP).join(","),
      },
      "google_translate_element"
    );

    // After init, check if there's a saved language
    const saved = localStorage.getItem("language") || "en";
    if (saved !== "en") {
      setTimeout(() => triggerTranslate(saved), 1000);
    }
  };

  // Load the script if not already loaded
  if (!document.getElementById("google-translate-script")) {
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }
}

interface TranslationWrapperProps {
  children: ReactNode;
}

const TranslationWrapper = ({ children }: TranslationWrapperProps) => {
  // Initialize Google Translate on mount
  useEffect(() => {
    initGoogleTranslate();

    const style = document.createElement("style");
    style.textContent = `
      .goog-te-banner-frame, .goog-te-balloon-frame,
      iframe.goog-te-banner-frame { display: none !important; height: 0 !important; width: 0 !important; visibility: hidden !important; overflow: hidden !important; }
      body { top: 0 !important; margin-top: 0 !important; position: static !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
      #google_translate_element { display: none !important; }
      .skiptranslate { display: none !important; height: 0 !important; overflow: hidden !important; }
      #goog-gt-tt, .goog-te-menu-value { display: none !important; }
    `;
    document.head.appendChild(style);

    // MutationObserver to strip any top/margin-top Google injects on body
    const observer = new MutationObserver(() => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }
      if (document.body.style.marginTop && document.body.style.marginTop !== "0px") {
        document.body.style.marginTop = "0px";
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLangChange = () => {
      const lang = localStorage.getItem("language") || "en";

      // RTL support
      const isRtl = RTL_LANGUAGES.includes(lang);
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = lang;

      triggerTranslate(lang);
    };

    window.addEventListener("languagechange-custom", handleLangChange);
    window.addEventListener("storage", handleLangChange);
    return () => {
      window.removeEventListener("languagechange-custom", handleLangChange);
      window.removeEventListener("storage", handleLangChange);
    };
  }, []);

  return <>{children}</>;
};

export default TranslationWrapper;
