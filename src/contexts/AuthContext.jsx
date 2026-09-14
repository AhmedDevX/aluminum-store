import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../api/client.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "auth_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage?.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(null);
  // "loading" only covers the initial session restore on page load.
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me(token)
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        // Token is invalid/expired: drop the session silently.
        if (!cancelled) {
          setToken(null);
          window.localStorage?.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Only re-run when the token itself changes (login/logout), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function persistSession(data) {
    setToken(data.token);
    setUser(data.user);
    window.localStorage?.setItem(STORAGE_KEY, data.token);
  }

  async function login(identifier, password) {
    const data = await api.login({ identifier, password });
    persistSession(data);
    return data.user;
  }

  async function register(fullName, identifier, password) {
    const data = await api.register({ fullName, identifier, password });
    persistSession(data);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.localStorage?.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAdmin: user?.role === "admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
