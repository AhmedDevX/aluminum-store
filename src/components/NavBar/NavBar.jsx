import { NavLink } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "./NavBar.css";

export default function NavBar() {
  const { t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="navbar">
      <span className="navbar__brand">{t("brand")}</span>

      <nav className="navbar__links">
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `navbar__link ${isActive ? "is-active" : ""}`
          }
        >
          {t("navProducts")}
        </NavLink>
        <NavLink
          to="/my-requests"
          className={({ isActive }) =>
            `navbar__link ${isActive ? "is-active" : ""}`
          }
        >
          {t("navMyRequests")}
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `navbar__link ${isActive ? "is-active" : ""}`
          }
        >
          {t("navChat")}
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `navbar__link ${isActive ? "is-active" : ""}`
          }
        >
          {t("navAbout")}
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "is-active" : ""}`
            }
          >
            {t("navAdmin")}
          </NavLink>
        )}
      </nav>

      <div className="navbar__actions">
        <button
          type="button"
          className="navbar__action"
          onClick={toggleLanguage}
        >
          {t("toggleLanguage")}
        </button>
        <button
          type="button"
          className="navbar__action navbar__action--icon"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? t("toggleThemeToLight") : t("toggleThemeToDark")
          }
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>

        {user ? (
          <div className="navbar__account">
            <span className="navbar__account-name">
              {t("loggedInAs")} {user.fullName}
            </span>
            <button type="button" className="navbar__action" onClick={logout}>
              {t("logout")}
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="navbar__action">
            {t("navLogin")}
          </NavLink>
        )}
      </div>
    </header>
  );
}
