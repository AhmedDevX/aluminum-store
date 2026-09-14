import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import "./TopBar.css";

export default function TopBar() {
  const { t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="topbar">
      <button
        type="button"
        className="topbar__button"
        onClick={toggleLanguage}
        aria-label={t("toggleLanguage")}
      >
        {t("toggleLanguage")}
      </button>
      <button
        type="button"
        className="topbar__button topbar__button--icon"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("toggleThemeToLight") : t("toggleThemeToDark")}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </div>
  );
}
