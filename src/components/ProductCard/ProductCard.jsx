import { useLanguage } from "../../contexts/LanguageContext.jsx";
import "./ProductCard.css";

export default function ProductCard({ product, onRequestQuote }) {
  const { lang, t } = useLanguage();
  const name = product.name[lang];
  const description = product.description[lang];
  const coverImage = product.images[0];
  const extraCount = product.images.length - 1;

  return (
    <article className="product-card">
      <div className="product-card__media">
        <img src={coverImage} alt={name} loading="lazy" />
        {extraCount > 0 && (
          <span className="product-card__badge">
            +{extraCount} {t("imagesCount")}
          </span>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{name}</h3>
        <p className="product-card__description">{description}</p>
        <p className="product-card__price">{t("priceNote")}</p>
        <button
          type="button"
          className="product-card__cta"
          onClick={() => onRequestQuote(product)}
        >
          {t("requestQuote")}
        </button>
      </div>
    </article>
  );
}
