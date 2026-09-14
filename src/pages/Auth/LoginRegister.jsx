import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAuth, ApiError } from "../../contexts/AuthContext.jsx";
import TopBar from "../../components/TopBar/TopBar.jsx";
import "./LoginRegister.css";

const ERROR_MESSAGE_KEY = {
  "An account with this phone/email already exists.": "errorIdentifierTaken",
  "Invalid credentials.": "errorInvalidCredentials",
  "Password must be at least 6 characters.": "errorPasswordTooShort",
  networkError: "errorNetwork",
  requestFailed: "errorGeneric"
};

export default function LoginRegister() {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    fullName: "",
    identifier: "",
    password: "",
    confirmPassword: "",
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (mode === "register" && !form.fullName.trim()) {
      nextErrors.fullName = t("fieldRequired");
    }
    if (!form.identifier.trim()) {
      nextErrors.identifier = t("fieldRequired");
    }
    if (!form.password) {
      nextErrors.password = t("fieldRequired");
    }
    if (mode === "register" && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = t("passwordsMismatch");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user =
        mode === "register"
          ? await register(form.fullName.trim(), form.identifier.trim(), form.password)
          : await login(form.identifier.trim(), form.password);

      const redirectTo = user.role === "admin" ? "/admin" : location.state?.from || "/products";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const key =
        err instanceof ApiError
          ? ERROR_MESSAGE_KEY[err.message] || "errorGeneric"
          : "errorGeneric";
      setServerError(t(key));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-panel" aria-hidden="true">
        <svg
          className="auth-panel__lines"
          viewBox="0 0 400 600"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={i}
              x1={-100 + i * 40}
              y1="600"
              x2={100 + i * 40}
              y2="0"
              stroke="var(--color-panel-line)"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="auth-panel__content">
          <p className="auth-panel__brand">{t("brand")}</p>
          <h1 className="auth-panel__tagline">{t("tagline")}</h1>
          <p className="auth-panel__subtagline">{t("subtagline")}</p>
        </div>
      </aside>

      <main className="auth-form-area">
        <TopBar />

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-tabs__item ${mode === "login" ? "is-active" : ""}`}
              onClick={() => {
                setMode("login");
                setServerError("");
              }}
            >
              {t("tabLogin")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={`auth-tabs__item ${mode === "register" ? "is-active" : ""}`}
              onClick={() => {
                setMode("register");
                setServerError("");
              }}
            >
              {t("tabRegister")}
            </button>
          </div>

          {serverError && <p className="auth-server-error">{serverError}</p>}

          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="fullName">{t("fullName")}</label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                aria-invalid={Boolean(errors.fullName)}
              />
              {errors.fullName && (
                <span className="auth-field__error">{errors.fullName}</span>
              )}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="identifier">{t("phoneOrEmail")}</label>
            <input
              id="identifier"
              type="text"
              value={form.identifier}
              onChange={(e) => updateField("identifier", e.target.value)}
              aria-invalid={Boolean(errors.identifier)}
            />
            {errors.identifier && (
              <span className="auth-field__error">{errors.identifier}</span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <span className="auth-field__error">{errors.password}</span>
            )}
          </div>

          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="confirmPassword">{t("confirmPassword")}</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <span className="auth-field__error">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          {mode === "login" && (
            <div className="auth-form__row">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => updateField("rememberMe", e.target.checked)}
                />
                {t("rememberMe")}
              </label>
              <a className="auth-form__link" href="#forgot-password">
                {t("forgotPassword")}
              </a>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? t("submitting")
              : mode === "login"
              ? t("loginButton")
              : t("registerButton")}
          </button>

          <p className="auth-switch">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <button
              type="button"
              className="auth-switch__link"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setServerError("");
              }}
            >
              {mode === "login" ? t("switchToRegister") : t("switchToLogin")}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
