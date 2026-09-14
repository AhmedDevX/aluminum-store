import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations.js";

const LanguageContext = createContext(null);

const RTL_LANGS = ["ar"];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return window.localStorage?.getItem("lang") || "ar";
  });

  useEffect(() => {
    const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
    window.localStorage?.setItem("lang", lang);
  }, [lang]);

  function toggleLanguage() {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations.ar[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
