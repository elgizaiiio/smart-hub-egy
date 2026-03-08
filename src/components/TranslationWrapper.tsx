import { useEffect, useRef, ReactNode } from "react";

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
  let attempts = 0;

  // Use the Google Translate combo to switch language (limited retries)
  const trySwitch = () => {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      const { pairs, cleanup } = buildAttributeMirror();
      select.value = gtLang;
      select.dispatchEvent(new Event("change"));
      // Copy translated text back to placeholder/title/aria-label
      setTimeout(() => applyMirroredAttributes(pairs, cleanup), 1800);
      return;
    }

    attempts += 1;
    if (attempts < 20) {
      setTimeout(trySwitch, 300);
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

type AttrMirrorPair = { el: Element; attr: string; span: HTMLSpanElement };

/** Build hidden mirror nodes so Google can translate input attributes. */
function buildAttributeMirror() {
  const ATTR_NAMES = ["placeholder", "title", "aria-label"] as const;
  const existing = document.getElementById("gt-attr-mirror");
  if (existing) existing.remove();

  const mirror = document.createElement("div");
  mirror.id = "gt-attr-mirror";
  mirror.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;overflow:hidden;height:0;width:0;";
  document.body.appendChild(mirror);

  const pairs: AttrMirrorPair[] = [];
  document.querySelectorAll("input, textarea, [title], [aria-label]").forEach((el) => {
    ATTR_NAMES.forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) return;

      const dataKey = `data-orig-${attr}`;
      if (!el.getAttribute(dataKey)) {
        el.setAttribute(dataKey, val);
      }

      const span = document.createElement("span");
      span.textContent = el.getAttribute(dataKey) || val;
      mirror.appendChild(span);
      pairs.push({ el, attr, span });
    });
  });

  return {
    pairs,
    cleanup: () => mirror.remove(),
  };
}

/** Copy translated mirror text back into placeholder/title/aria-label. */
function applyMirroredAttributes(pairs: AttrMirrorPair[], cleanup: () => void) {
  pairs.forEach(({ el, attr, span }) => {
    const translated = span.textContent || "";
    if (translated.trim()) {
      el.setAttribute(attr, translated);
    }
  });
  cleanup();
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
  const appliedLangRef = useRef<string>("en");
  const lastRouteKeyRef = useRef<string>("");
  const translateLockRef = useRef(false);
  const lastTranslateAtRef = useRef(0);

  const safeTriggerTranslate = (lang: string) => {
    const now = Date.now();
    if (translateLockRef.current) return;
    if (now - lastTranslateAtRef.current < 1200) return;

    translateLockRef.current = true;
    lastTranslateAtRef.current = now;
    triggerTranslate(lang);

    // Unlock after Google finishes DOM work
    setTimeout(() => {
      translateLockRef.current = false;
    }, 1800);
  };

  // Initialize Google Translate on mount
  useEffect(() => {
    initGoogleTranslate();

    const style = document.createElement("style");
    style.textContent = `
      .goog-te-banner-frame, .goog-te-balloon-frame,
      iframe.goog-te-banner-frame,
      .goog-te-spinner-pos,
      .goog-te-spinner-animation,
      [class*="VIpgJd-ZVi9od-"],
      [class*="goog-te-spinner"] { display: none !important; height: 0 !important; width: 0 !important; visibility: hidden !important; overflow: hidden !important; opacity: 0 !important; pointer-events: none !important; }
      body { top: 0px !important; margin-top: 0px !important; position: static !important; }
      html > body { top: 0px !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
      #google_translate_element { display: none !important; }
      .skiptranslate { display: none !important; height: 0 !important; overflow: hidden !important; opacity: 0 !important; }
      #goog-gt-tt, .goog-te-menu-value { display: none !important; }
    `;
    document.head.appendChild(style);

    // Aggressively strip body.style.top and hide banner frames
    const cleanUp = () => {
      document.body.style.top = "0px";
      document.body.style.marginTop = "0px";
      // Hide any banner iframes Google creates
      document.querySelectorAll<HTMLIFrameElement>(".goog-te-banner-frame, iframe.skiptranslate").forEach(f => {
        f.style.display = "none";
        f.style.height = "0";
        f.style.visibility = "hidden";
      });
    };

    // MutationObserver on body attributes
    const bodyObserver = new MutationObserver(cleanUp);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });

    // MutationObserver on document to catch newly added iframes/elements
    const docObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.classList?.contains("skiptranslate") || node.classList?.contains("goog-te-banner-frame")) {
              node.style.display = "none";
              node.style.height = "0";
              node.style.visibility = "hidden";
            }
          }
        }
      }
      cleanUp();
    });
    docObserver.observe(document.documentElement, { childList: true, subtree: true });

    // Periodic fallback for first few seconds
    const interval = setInterval(cleanUp, 100);
    setTimeout(() => clearInterval(interval), 5000);

    return () => {
      bodyObserver.disconnect();
      docObserver.disconnect();
      clearInterval(interval);
      document.head.removeChild(style);
    };
  }, []);

  // Listen for language changes
  useEffect(() => {
    const applyLanguage = (lang: string) => {
      const isRtl = RTL_LANGUAGES.includes(lang);
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = lang;

      // Avoid repeated translate triggers for the same language
      if (appliedLangRef.current === lang) {
        return;
      }
      appliedLangRef.current = lang;
      safeTriggerTranslate(lang);
    };

    const handleLangChange = () => {
      const lang = localStorage.getItem("language") || "en";
      applyLanguage(lang);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key !== "language") return;
      const lang = event.newValue || localStorage.getItem("language") || "en";
      applyLanguage(lang);
    };

    // Sync initial document lang/dir without forcing translate again
    handleLangChange();

    window.addEventListener("languagechange-custom", handleLangChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("languagechange-custom", handleLangChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Re-translate once per SPA route change (without mutation loops)
  useEffect(() => {
    const runForCurrentRoute = () => {
      const lang = localStorage.getItem("language") || "en";
      if (lang === "en") return;

      const routeKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (lastRouteKeyRef.current === routeKey) return;

      lastRouteKeyRef.current = routeKey;
      safeTriggerTranslate(lang);
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRun = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(runForCurrentRoute, 300);
    };

    // Initial route sync
    scheduleRun();

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    history.pushState = function (...args) {
      originalPush.apply(history, args);
      scheduleRun();
    };

    history.replaceState = function (...args) {
      originalReplace.apply(history, args);
      scheduleRun();
    };

    window.addEventListener("popstate", scheduleRun);
    window.addEventListener("hashchange", scheduleRun);

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", scheduleRun);
      window.removeEventListener("hashchange", scheduleRun);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return <>{children}</>;
};

export default TranslationWrapper;
