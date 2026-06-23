import axios from "axios";
import Cookies from "js-cookie";

const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token key — confirmed from DevTools: cookie name is "token" ──
const TOKEN_KEY = "token";

export const getToken = (): string | null =>
  Cookies.get(TOKEN_KEY) ?? null;

// Call after successful login to persist the token
export const setAuth = (token: string) => {
  Cookies.set(TOKEN_KEY, token, {
    expires:  7,       // 7 days
    path:     "/",
    sameSite: "Lax",
  });
};

// Call on logout to wipe the token
export const clearAuth = () => {
  Cookies.remove(TOKEN_KEY, { path: "/" });
};

// ── Request interceptor — attach token to every request ──
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ───────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message: string = (error.response?.data?.message ?? "").toLowerCase();

      // Only redirect to login when the token itself is invalid/expired.
      // 401s from bad resource IDs or data errors should NOT trigger logout.
      const isAuthFailure =
        !message ||
        message.includes("token") ||
        message.includes("jwt") ||
        message.includes("expired") ||
        message.includes("unauthorized") ||
        message.includes("unauthenticated");

      if (isAuthFailure) {
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      // Non-auth 401s fall through to the caller's .catch() / rejectWithValue
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;