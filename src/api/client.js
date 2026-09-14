const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError("networkError", 0);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(data?.error || "requestFailed", response.status);
  }

  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: (token) => request("/auth/me", { token }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => request(`/products/${id}`),

  submitQuoteRequest: (body, token) =>
    request("/quote-requests", { method: "POST", body, token }),
  getMyQuoteRequests: (token) => request("/quote-requests/mine", { token }),

  submitContactMessage: (body, token) =>
    request("/contact-messages", { method: "POST", body, token }),

  // Admin: products
  createProduct: (body, token) => request("/products", { method: "POST", body, token }),
  updateProduct: (id, body, token) =>
    request(`/products/${id}`, { method: "PUT", body, token }),
  deleteProduct: (id, token) => request(`/products/${id}`, { method: "DELETE", token }),

  // Admin: quote requests
  getAdminQuoteRequests: (token) => request("/quote-requests/admin/all", { token }),
  updateQuoteRequestStatus: (id, status, token) =>
    request(`/quote-requests/admin/${id}/status`, { method: "PATCH", body: { status }, token }),

  // Admin: contact messages
  getAdminContactMessages: (token) => request("/contact-messages/admin/all", { token }),
  updateContactMessageStatus: (id, status, token) =>
    request(`/contact-messages/admin/${id}/status`, { method: "PATCH", body: { status }, token }),

  // Chat history (REST)
  getChatHistory: (token) => request("/chat/history", { token }),
  getAdminConversations: (token) => request("/chat/admin/conversations", { token }),
  getAdminConversationHistory: (userId, token) =>
    request(`/chat/admin/${userId}/history`, { token })
};
