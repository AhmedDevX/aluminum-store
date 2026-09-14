import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAuth, ApiError } from "../../contexts/AuthContext.jsx";
import NavBar from "../../components/NavBar/NavBar.jsx";
import { api } from "../../api/client.js";
import "./ProductDetail.css";

const CATEGORY_LABEL_KEY = {
  windows: "categoryWindows",
  doors: "categoryDoors",
  wardrobes: "categoryWardrobes"
};

function buildInitialForm(user) {
  return {
    width: "",
    height: "",
    quantity: "1",
    color: "",
    customerName: user?.fullName || "",
    customerPhone: /^[0-9+\s-]+$/.test(user?.identifier || "") ? user.identifier : "",
    notes: ""
  };
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { user, token } = useAuth();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | not-found | error

  const [activeImage, setActiveImage] = useState(0);
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setActiveImage(0);

    api
      .getProduct(productId)
      .then((data) => {
        if (cancelled) return;
        setProduct(data.product);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err instanceof ApiError && err.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (status === "loading") {
    return (
      <div className="product-detail-missing">
        <p>{t("loadingProducts")}</p>
      </div>
    );
  }

  if (status === "not-found" || status === "error") {
    return (
      <div className="product-detail-missing">
        <p>{status === "not-found" ? t("noResults") : t("errorNetwork")}</p>
        <Link to="/products">{t("backToProducts")}</Link>
      </div>
    );
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.width) nextErrors.width = t("fieldRequired");
    if (!form.height) nextErrors.height = t("fieldRequired");
    if (!form.customerName.trim()) nextErrors.customerName = t("fieldRequired");
    if (!form.customerPhone.trim()) nextErrors.customerPhone = t("fieldRequired");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.submitQuoteRequest(
        {
          productId: product.id,
          width: Number(form.width),
          height: Number(form.height),
          quantity: Number(form.quantity) || 1,
          color: form.color,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          notes: form.notes
        },
        token
      );
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof ApiError && err.message === "networkError" ? t("errorNetwork") : t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="product-detail">
      <NavBar />

      <div className="product-detail__body">
        <Link to="/products" className="product-detail__back">
          {lang === "ar" ? "→" : "←"} {t("backToProducts")}
        </Link>

        <div className="product-detail__content">
        <section className="product-gallery">
          <div className="product-gallery__main">
            <img src={product.images[activeImage]} alt={product.name[lang]} />
          </div>
          {product.images.length > 1 && (
            <div className="product-gallery__thumbs">
              {product.images.map((src, index) => (
                <button
                  type="button"
                  key={src}
                  className={`product-gallery__thumb ${
                    index === activeImage ? "is-active" : ""
                  }`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`${product.name[lang]} ${index + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="product-info">
          <p className="product-info__category">
            {t(CATEGORY_LABEL_KEY[product.category])}
          </p>
          <h1 className="product-info__name">{product.name[lang]}</h1>
          <p className="product-info__description">
            {product.description[lang]}
          </p>
          <p className="product-info__price-note">{t("priceNote")}</p>

          {submitted ? (
            <div className="quote-success">
              <h2>{t("quoteSuccessTitle")}</h2>
              <p>{t("quoteSuccessBody")}</p>
              <button
                type="button"
                className="quote-success__cta"
                onClick={() => navigate("/products")}
              >
                {t("backToProducts")}
              </button>
            </div>
          ) : (
            <form className="quote-form" onSubmit={handleSubmit} noValidate>
              <h2 className="quote-form__title">{t("quoteFormTitle")}</h2>

              {serverError && <p className="auth-server-error">{serverError}</p>}

              <div className="quote-form__row">
                <div className="auth-field">
                  <label htmlFor="width">{t("widthLabel")}</label>
                  <input
                    id="width"
                    type="number"
                    min="1"
                    value={form.width}
                    onChange={(e) => updateField("width", e.target.value)}
                    aria-invalid={Boolean(errors.width)}
                  />
                  {errors.width && (
                    <span className="auth-field__error">{errors.width}</span>
                  )}
                </div>
                <div className="auth-field">
                  <label htmlFor="height">{t("heightLabel")}</label>
                  <input
                    id="height"
                    type="number"
                    min="1"
                    value={form.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    aria-invalid={Boolean(errors.height)}
                  />
                  {errors.height && (
                    <span className="auth-field__error">{errors.height}</span>
                  )}
                </div>
              </div>

              <div className="quote-form__row">
                <div className="auth-field">
                  <label htmlFor="quantity">{t("quantityLabel")}</label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="color">{t("colorLabel")}</label>
                  <input
                    id="color"
                    type="text"
                    value={form.color}
                    onChange={(e) => updateField("color", e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="customerName">{t("customerNameLabel")}</label>
                <input
                  id="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  aria-invalid={Boolean(errors.customerName)}
                />
                {errors.customerName && (
                  <span className="auth-field__error">
                    {errors.customerName}
                  </span>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="customerPhone">{t("customerPhoneLabel")}</label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  aria-invalid={Boolean(errors.customerPhone)}
                />
                {errors.customerPhone && (
                  <span className="auth-field__error">
                    {errors.customerPhone}
                  </span>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="notes">{t("notesLabel")}</label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder={t("notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? t("submitting") : t("submitQuote")}
              </button>
            </form>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
