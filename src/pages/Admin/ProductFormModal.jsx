import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const CATEGORY_LABEL_KEY = {
  windows: "categoryWindows",
  doors: "categoryDoors",
  wardrobes: "categoryWardrobes"
};

function toFormState(product) {
  return {
    category: product?.category || "windows",
    nameAr: product?.name?.ar || "",
    nameEn: product?.name?.en || "",
    descriptionAr: product?.description?.ar || "",
    descriptionEn: product?.description?.en || "",
    images: (product?.images || []).join("\n")
  };
}

export default function ProductFormModal({ product, categories, onSave, onClose, saving, serverError }) {
  const { t } = useLanguage();
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => toFormState(product));
  const [errors, setErrors] = useState({});

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.nameAr.trim()) nextErrors.nameAr = t("fieldRequired");
    if (!form.nameEn.trim()) nextErrors.nameEn = t("fieldRequired");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const images = form.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    onSave({
      category: form.category,
      name: { ar: form.nameAr.trim(), en: form.nameEn.trim() },
      description: { ar: form.descriptionAr.trim(), en: form.descriptionEn.trim() },
      images
    });
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-modal__title">
          {isEdit ? t("adminProductFormTitleEdit") : t("adminProductFormTitleAdd")}
        </h2>

        <form className="admin-modal-form" onSubmit={handleSubmit} noValidate>
          {serverError && <p className="auth-server-error">{serverError}</p>}

          <div className="auth-field">
            <label htmlFor="p-category">{t("adminFieldCategory")}</label>
            <select
              id="p-category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {t(CATEGORY_LABEL_KEY[category])}
                </option>
              ))}
            </select>
          </div>

          <div className="quote-form__row">
            <div className="auth-field">
              <label htmlFor="p-name-ar">{t("adminFieldNameAr")}</label>
              <input
                id="p-name-ar"
                type="text"
                value={form.nameAr}
                onChange={(e) => updateField("nameAr", e.target.value)}
                aria-invalid={Boolean(errors.nameAr)}
              />
              {errors.nameAr && <span className="auth-field__error">{errors.nameAr}</span>}
            </div>
            <div className="auth-field">
              <label htmlFor="p-name-en">{t("adminFieldNameEn")}</label>
              <input
                id="p-name-en"
                type="text"
                value={form.nameEn}
                onChange={(e) => updateField("nameEn", e.target.value)}
                aria-invalid={Boolean(errors.nameEn)}
              />
              {errors.nameEn && <span className="auth-field__error">{errors.nameEn}</span>}
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="p-desc-ar">{t("adminFieldDescriptionAr")}</label>
            <textarea
              id="p-desc-ar"
              rows={2}
              value={form.descriptionAr}
              onChange={(e) => updateField("descriptionAr", e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="p-desc-en">{t("adminFieldDescriptionEn")}</label>
            <textarea
              id="p-desc-en"
              rows={2}
              value={form.descriptionEn}
              onChange={(e) => updateField("descriptionEn", e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="p-images">{t("adminFieldImages")}</label>
            <textarea
              id="p-images"
              rows={3}
              placeholder={t("adminFieldImagesHint")}
              value={form.images}
              onChange={(e) => updateField("images", e.target.value)}
            />
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-secondary-btn" onClick={onClose}>
              {t("adminCancel")}
            </button>
            <button type="submit" className="admin-primary-btn" disabled={saving}>
              {saving ? t("submitting") : t("adminSave")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
