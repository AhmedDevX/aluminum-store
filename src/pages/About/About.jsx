import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAuth, ApiError } from "../../contexts/AuthContext.jsx";
import NavBar from "../../components/NavBar/NavBar.jsx";
import { api } from "../../api/client.js";
import "./About.css";

const VALUE_KEYS = [
  { titleKey: "aboutValue1Title", bodyKey: "aboutValue1Body" },
  { titleKey: "aboutValue2Title", bodyKey: "aboutValue2Body" },
  { titleKey: "aboutValue3Title", bodyKey: "aboutValue3Body" }
];

const STAT_KEYS = [
  { valueKey: "aboutStat1Value", labelKey: "aboutStat1Label" },
  { valueKey: "aboutStat2Value", labelKey: "aboutStat2Label" },
  { valueKey: "aboutStat3Value", labelKey: "aboutStat3Label" }
];

const initialForm = {
  name: "",
  contact: "",
  subject: "",
  message: ""
};

export default function About() {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = t("fieldRequired");
    if (!form.contact.trim()) nextErrors.contact = t("fieldRequired");
    if (!form.message.trim()) nextErrors.message = t("fieldRequired");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.submitContactMessage(
        {
          name: form.name.trim(),
          contact: form.contact.trim(),
          subject: form.subject.trim(),
          message: form.message.trim()
        },
        token
      );
      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setServerError(
        err instanceof ApiError && err.message === "networkError"
          ? t("errorNetwork")
          : t("errorGeneric")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="about-page">
      <NavBar />

      <div className="about-page__body">
        <section className="about-hero">
          <h1 className="about-hero__title">{t("aboutHeroTitle")}</h1>
          <p className="about-hero__body">{t("aboutHeroBody")}</p>

          <div className="about-stats">
            {STAT_KEYS.map((stat) => (
              <div className="about-stats__item" key={stat.valueKey}>
                <span className="about-stats__value">{t(stat.valueKey)}</span>
                <span className="about-stats__label">{t(stat.labelKey)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-values">
          <h2 className="about-section-title">{t("aboutValuesTitle")}</h2>
          <div className="about-values__grid">
            {VALUE_KEYS.map((value) => (
              <div className="about-value-card" key={value.titleKey}>
                <h3 className="about-value-card__title">{t(value.titleKey)}</h3>
                <p className="about-value-card__body">{t(value.bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="contact-section">
          <h2 className="about-section-title">{t("contactSectionTitle")}</h2>
          <p className="contact-section__subtitle">{t("contactSectionSubtitle")}</p>

          <div className="contact-section__grid">
            <div className="contact-info">
              <div className="contact-info__item">
                <span className="contact-info__label">{t("contactInfoPhoneLabel")}</span>
                <span className="contact-info__value">{t("contactInfoPhoneValue")}</span>
              </div>
              <div className="contact-info__item">
                <span className="contact-info__label">{t("contactInfoEmailLabel")}</span>
                <span className="contact-info__value">{t("contactInfoEmailValue")}</span>
              </div>
              <div className="contact-info__item">
                <span className="contact-info__label">{t("contactInfoAddressLabel")}</span>
                <span className="contact-info__value">{t("contactInfoAddressValue")}</span>
              </div>
              <div className="contact-info__item">
                <span className="contact-info__label">{t("contactInfoHoursLabel")}</span>
                <span className="contact-info__value">{t("contactInfoHoursValue")}</span>
              </div>
            </div>

            <div className="contact-form-wrap">
              {submitted ? (
                <div className="quote-success">
                  <h2>{t("contactSuccessTitle")}</h2>
                  <p>{t("contactSuccessBody")}</p>
                  <button
                    type="button"
                    className="quote-success__cta"
                    onClick={() => setSubmitted(false)}
                  >
                    {t("contactSendAnother")}
                  </button>
                </div>
              ) : (
                <form className="quote-form" onSubmit={handleSubmit} noValidate>
                  <h2 className="quote-form__title">{t("contactFormTitle")}</h2>

                  {serverError && <p className="auth-server-error">{serverError}</p>}

                  <div className="auth-field">
                    <label htmlFor="name">{t("contactNameLabel")}</label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name && (
                      <span className="auth-field__error">{errors.name}</span>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="contact">{t("contactPhoneOrEmailLabel")}</label>
                    <input
                      id="contact"
                      type="text"
                      value={form.contact}
                      onChange={(e) => updateField("contact", e.target.value)}
                      aria-invalid={Boolean(errors.contact)}
                    />
                    {errors.contact && (
                      <span className="auth-field__error">{errors.contact}</span>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="subject">{t("contactSubjectLabel")}</label>
                    <input
                      id="subject"
                      type="text"
                      value={form.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="message">{t("contactMessageLabel")}</label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder={t("contactMessagePlaceholder")}
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      aria-invalid={Boolean(errors.message)}
                    />
                    {errors.message && (
                      <span className="auth-field__error">{errors.message}</span>
                    )}
                  </div>

                  <button type="submit" className="auth-submit" disabled={submitting}>
                    {submitting ? t("submitting") : t("contactSubmit")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
