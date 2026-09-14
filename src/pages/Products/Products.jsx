import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import NavBar from "../../components/NavBar/NavBar.jsx";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import { api } from "../../api/client.js";
import "./Products.css";

const CATEGORIES = ["windows", "doors", "wardrobes"];

const CATEGORY_LABEL_KEY = {
  windows: "categoryWindows",
  doors: "categoryDoors",
  wardrobes: "categoryWardrobes"
};

export default function Products() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    api
      .getProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.category === activeCategory;
      const matchesQuery = product.name[lang]
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, activeCategory, query, lang]);

  function handleRequestQuote(product) {
    navigate(`/products/${product.id}`);
  }

  return (
    <div className="products-page">
      <NavBar />

      <div className="products-page__body">
        <div className="products-toolbar">
          <h1 className="products-header__title">{t("productsTitle")}</h1>
          <input
            type="search"
            className="products-search"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="products-filters" role="tablist">
            <button
              type="button"
              className={`products-filters__item ${
                activeCategory === "all" ? "is-active" : ""
              }`}
              onClick={() => setActiveCategory("all")}
            >
              {t("categoryAll")}
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`products-filters__item ${
                  activeCategory === category ? "is-active" : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {t(CATEGORY_LABEL_KEY[category])}
              </button>
            ))}
          </div>
        </div>

        {status === "loading" && (
          <p className="products-empty">{t("loadingProducts")}</p>
        )}

        {status === "error" && (
          <p className="products-empty">{t("errorNetwork")}</p>
        )}

        {status === "ready" &&
          (filteredProducts.length === 0 ? (
            <p className="products-empty">{t("noResults")}</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onRequestQuote={handleRequestQuote}
                />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
