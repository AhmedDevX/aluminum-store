import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api } from "../../api/client.js";
import ProductFormModal from "./ProductFormModal.jsx";
import AdminChatPanel from "./AdminChatPanel.jsx";
import "./AdminDashboard.css";

const CATEGORIES = ["windows", "doors", "wardrobes"];

const CATEGORY_LABEL_KEY = {
  windows: "categoryWindows",
  doors: "categoryDoors",
  wardrobes: "categoryWardrobes"
};

const STATUS_LABEL_KEY = {
  pending: "requestStatusPending",
  contacted: "requestStatusContacted",
  closed: "requestStatusClosed"
};

const MESSAGE_STATUS_LABEL_KEY = {
  new: "messageStatusNew",
  read: "messageStatusRead"
};

const TABS = ["overview", "requests", "messages", "products", "chat"];

export default function AdminDashboard() {
  const { lang, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading"); // loading | ready | error
  const [expandedMessageId, setExpandedMessageId] = useState(null);

  const [productModal, setProductModal] = useState(null); // null | "add" | product object being edited
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    setLoadStatus("loading");
    Promise.all([
      api.getAdminQuoteRequests(token),
      api.getAdminContactMessages(token),
      api.getProducts()
    ])
      .then(([requestsData, messagesData, productsData]) => {
        if (cancelled) return;
        setRequests(requestsData.requests);
        setMessages(messagesData.messages);
        setProducts(productsData.products);
        setLoadStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const newMessagesCount = messages.filter((m) => m.status === "new").length;

  async function updateRequestStatus(id, status) {
    const previous = requests;
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await api.updateQuoteRequestStatus(id, status, token);
    } catch {
      setRequests(previous); // revert on failure
    }
  }

  async function persistMessageStatus(id, status) {
    const previous = messages;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    try {
      await api.updateContactMessageStatus(id, status, token);
    } catch {
      setMessages(previous);
    }
  }

  function toggleMessage(id) {
    setExpandedMessageId((prev) => (prev === id ? null : id));
    const message = messages.find((m) => m.id === id);
    if (message?.status === "new") persistMessageStatus(id, "read");
  }

  function toggleMessageStatus(id, event) {
    event.stopPropagation();
    const message = messages.find((m) => m.id === id);
    persistMessageStatus(id, message.status === "new" ? "read" : "new");
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm(t("adminConfirmDelete"))) return;
    const previous = products;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.deleteProduct(id, token);
    } catch {
      setProducts(previous);
    }
  }

  async function handleSaveProduct(payload) {
    setSavingProduct(true);
    setProductFormError("");
    try {
      if (productModal === "add") {
        const { product } = await api.createProduct(payload, token);
        setProducts((prev) => [product, ...prev]);
      } else {
        const { product } = await api.updateProduct(productModal.id, payload, token);
        setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
      }
      setProductModal(null);
    } catch {
      setProductFormError(t("errorGeneric"));
    } finally {
      setSavingProduct(false);
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-sidebar__brand">{t("brand")}</p>
        <nav className="admin-sidebar__nav">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-sidebar__link ${
                activeTab === tab ? "is-active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`adminNav${tab[0].toUpperCase()}${tab.slice(1)}`)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-topbar__title">{t("adminTitle")}</h1>
          <div className="admin-topbar__actions">
            <button type="button" onClick={toggleLanguage}>
              {t("toggleLanguage")}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? t("toggleThemeToLight") : t("toggleThemeToDark")
              }
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </header>

        {loadStatus === "loading" && <p className="admin-empty-state">{t("loadingProducts")}</p>}
        {loadStatus === "error" && <p className="admin-empty-state">{t("errorNetwork")}</p>}

        {loadStatus === "ready" && (
          <>
            {activeTab === "overview" && (
              <section className="admin-stats">
                <div className="admin-stat-card">
                  <p className="admin-stat-card__value">{requests.length}</p>
                  <p className="admin-stat-card__label">{t("adminStatRequests")}</p>
                </div>
                <div className="admin-stat-card">
                  <p className="admin-stat-card__value">{pendingCount}</p>
                  <p className="admin-stat-card__label">{t("adminStatPending")}</p>
                </div>
                <div className="admin-stat-card">
                  <p className="admin-stat-card__value">{newMessagesCount}</p>
                  <p className="admin-stat-card__label">{t("adminStatMessages")}</p>
                </div>
                <div className="admin-stat-card">
                  <p className="admin-stat-card__value">{products.length}</p>
                  <p className="admin-stat-card__label">{t("adminStatProducts")}</p>
                </div>
              </section>
            )}

            {activeTab === "requests" && (
              <section className="admin-panel">
                <h2 className="admin-panel__title">{t("adminRequestsTitle")}</h2>
                {requests.length === 0 ? (
                  <p className="admin-empty-state">{t("adminMessagesEmpty")}</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t("adminColCustomer")}</th>
                          <th>{t("adminColProduct")}</th>
                          <th>{t("adminColSize")}</th>
                          <th>{t("adminColDate")}</th>
                          <th>{t("adminColStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <div className="admin-table__customer">
                                <span>{request.customerName}</span>
                                <span className="admin-table__muted">
                                  {request.customerPhone}
                                </span>
                              </div>
                            </td>
                            <td>{productById[request.productId]?.name[lang]}</td>
                            <td>
                              {request.width}×{request.height} {t("sizeUnit")}
                            </td>
                            <td>{request.createdAt}</td>
                            <td>
                              <select
                                className={`admin-status-select admin-status-select--${request.status}`}
                                value={request.status}
                                onChange={(e) =>
                                  updateRequestStatus(request.id, e.target.value)
                                }
                              >
                                {Object.entries(STATUS_LABEL_KEY).map(
                                  ([value, key]) => (
                                    <option key={value} value={value}>
                                      {t(key)}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeTab === "messages" && (
              <section className="admin-panel">
                <h2 className="admin-panel__title">{t("adminMessagesTitle")}</h2>

                {messages.length === 0 ? (
                  <p className="admin-empty-state">{t("adminMessagesEmpty")}</p>
                ) : (
                  <div className="admin-messages-list">
                    {messages.map((message) => {
                      const isExpanded = expandedMessageId === message.id;
                      return (
                        <div
                          key={message.id}
                          className={`admin-message-card ${
                            message.status === "new" ? "is-new" : ""
                          } ${isExpanded ? "is-expanded" : ""}`}
                        >
                          <button
                            type="button"
                            className="admin-message-card__header"
                            onClick={() => toggleMessage(message.id)}
                          >
                            <span className="admin-message-card__dot" aria-hidden="true" />
                            <span className="admin-message-card__info">
                              <span className="admin-message-card__name">
                                {message.name}
                                {message.subject && (
                                  <span className="admin-message-card__subject">
                                    {" "}
                                    — {message.subject}
                                  </span>
                                )}
                              </span>
                              <span className="admin-table__muted">
                                {message.contact} · {message.createdAt}
                              </span>
                            </span>
                            <span
                              className={`admin-message-status admin-message-status--${message.status}`}
                            >
                              {t(MESSAGE_STATUS_LABEL_KEY[message.status])}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="admin-message-card__body">
                              <p>{message.message}</p>
                              <button
                                type="button"
                                className="admin-link-btn"
                                onClick={(e) => toggleMessageStatus(message.id, e)}
                              >
                                {message.status === "new"
                                  ? t("adminMarkAsRead")
                                  : t("adminMarkAsNew")}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === "products" && (
              <section className="admin-panel">
                <div className="admin-panel__header">
                  <h2 className="admin-panel__title">{t("adminProductsTitle")}</h2>
                  <button
                    type="button"
                    className="admin-primary-btn"
                    onClick={() => {
                      setProductFormError("");
                      setProductModal("add");
                    }}
                  >
                    {t("adminAddProduct")}
                  </button>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>{t("adminColProduct")}</th>
                        <th>{t("adminColCategory")}</th>
                        <th>{t("adminColImages")}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <img
                              className="admin-table__thumb"
                              src={product.images[0]}
                              alt={product.name[lang]}
                            />
                          </td>
                          <td>{product.name[lang]}</td>
                          <td>{t(CATEGORY_LABEL_KEY[product.category])}</td>
                          <td>{product.images.length}</td>
                          <td className="admin-table__row-actions">
                            <button
                              type="button"
                              className="admin-link-btn"
                              onClick={() => {
                                setProductFormError("");
                                setProductModal(product);
                              }}
                            >
                              {t("adminEdit")}
                            </button>
                            <button
                              type="button"
                              className="admin-link-btn admin-link-btn--danger"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              {t("adminDelete")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "chat" && <AdminChatPanel />}
          </>
        )}
      </main>

      {productModal && (
        <ProductFormModal
          product={productModal === "add" ? null : productModal}
          categories={CATEGORIES}
          onSave={handleSaveProduct}
          onClose={() => setProductModal(null)}
          saving={savingProduct}
          serverError={productFormError}
        />
      )}
    </div>
  );
}
