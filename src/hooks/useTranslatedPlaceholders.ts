import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Translates an array of English strings using Google Translate's mirror technique.
 * Returns the translated strings (or originals if language is English).
 */
export function useTranslatedPlaceholders(originals: string[]): string[] {
  const [translated, setTranslated] = useState<string[]>(originals);
  const originalsRef = useRef(originals);
  originalsRef.current = originals;

  const doTranslate = useCallback(() => {
    const lang = localStorage.getItem("language") || "en";
    if (lang === "en") {
      setTranslated(originalsRef.current);
      return;
    }

    // Create a hidden mirror div; Google Translate will translate its contents
    const mirror = document.createElement("div");
    mirror.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;overflow:hidden;height:0;width:0;";
    mirror.className = "gt-placeholder-mirror";

    const spans = originalsRef.current.map((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      span.style.display = "block";
      mirror.appendChild(span);
      return span;
    });

    document.body.appendChild(mirror);

    // Poll for translation (Google Translate modifies DOM text in-place)
    let attempts = 0;
    const maxAttempts = 20;
    const poll = setInterval(() => {
      attempts++;
      const results = spans.map((s) => s.textContent?.trim() || "");
      // Check if at least one span has changed from original
      const hasChanged = results.some(
        (r, i) => r !== originalsRef.current[i] && r.length > 0
      );

      if (hasChanged || attempts >= maxAttempts) {
        clearInterval(poll);
        if (hasChanged) {
          setTranslated(results);
        }
        mirror.remove();
      }
    }, 300);

    // Cleanup safety
    return () => {
      clearInterval(poll);
      mirror.remove();
    };
  }, []);

  useEffect(() => {
    // Initial translate
    const cleanup = doTranslate();

    const onLangChange = () => {
      const lang = localStorage.getItem("language") || "en";
      if (lang === "en") {
        setTranslated(originalsRef.current);
      } else {
        // Delay to let Google Translate widget initialize
        setTimeout(doTranslate, 1500);
      }
    };

    window.addEventListener("languagechange-custom", onLangChange);
    return () => {
      window.removeEventListener("languagechange-custom", onLangChange);
      if (typeof cleanup === "function") cleanup();
    };
  }, [doTranslate]);

  return translated;
}
