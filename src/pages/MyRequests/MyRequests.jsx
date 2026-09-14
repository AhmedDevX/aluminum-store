import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import NavBar from "../../components/NavBar/NavBar.jsx";
import { api } from "../../api/client.js";
import "./MyRequests.css";

const STATUS_LABEL_KEY = {
  pending: "requestStatusPending",
  contacted: "requestStatusContacted",
  closed: "requestStatusClosed"
};

export default function MyRequests() {
  const { lang, t } = useLanguage();
  const { token } = useAuth();

  const [requests, setRequests] = useState([]);
  const [productById, setProductById] = useState({});
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    Promise.all([api.getMyQuoteRequests(token), api.getProducts()])
      .then(([requestsData, productsData]) => {
        if (cancelled) return;
        setRequests(requestsData.requests);
        setProductById(
          Object.fromEntries(productsData.products.map((p) => [p.id, p]))
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="my-requests">
      <NavBar />

      <div className="my-requests__body">
        <h1 className="my-requests__title">{t("myRequestsTitle")}</h1>

        {status === "loading" && <p>{t("loadingProducts")}</p>}
        {status === "error" && <p>{t("errorNetwork")}</p>}

        {status === "ready" &&
          (requests.length === 0 ? (
            <div className="my-requests__empty">
              <p>{t("myRequestsEmpty")}</p>
              <Link to="/products" className="my-requests__empty-cta">
                {t("myRequestsEmptyCta")}
              </Link>
            </div>
          ) : (
            <div className="my-requests__list">
              {requests.map((request) => {
                const product = productById[request.productId];
                return (
                  <Link
                    to={`/products/${request.productId}`}
                    key={request.id}
                    className="request-card"
                  >
                    <img
                      className="request-card__image"
                      src={product?.images[0]}
                      alt={product?.name[lang] ?? ""}
                    />
                    <div className="request-card__body">
                      <h2 className="request-card__name">
                        {product?.name[lang]}
                      </h2>
                      <p className="request-card__meta">
                        {t("requestSize")}: {request.width}×{request.height}{" "}
                        {t("sizeUnit")}
                        {" · "}
                        {t("requestQuantityShort")}: {request.quantity}
                      </p>
                      <p className="request-card__date">
                        {t("requestDate")}: {request.createdAt}
                      </p>
                    </div>
                    <span
                      className={`request-status request-status--${request.status}`}
                    >
                      {t(STATUS_LABEL_KEY[request.status])}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
      </div>
    </div>
  );
}
