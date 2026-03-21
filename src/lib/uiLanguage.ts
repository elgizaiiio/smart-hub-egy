export type UiLanguage = "ar" | "en";

export const getUiLanguage = (): UiLanguage => {
  if (typeof window === "undefined") return "en";

  const saved = (localStorage.getItem("language") || document.documentElement.lang || "en").toLowerCase();
  return saved.startsWith("ar") ? "ar" : "en";
};

export const isArabicUI = () => getUiLanguage() === "ar";

export const uiText = <T,>(copy: { ar: T; en: T }): T =>
  getUiLanguage() === "ar" ? copy.ar : copy.en;