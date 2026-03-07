"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { translations, type Language, type Translations } from "./i18n";

export type { Language };

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");

  const value: LanguageContextValue = {
    lang,
    setLang,
    t: translations[lang],
    dir: lang === "ar" ? "rtl" : "ltr",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};
