import axios from "axios";

const AUTH_TOKEN_KEY = "authToken";
const LEGACY_TOKEN_KEY = "token";
const AUTH_EXPIRY_KEY = "authTokenExpiry";
const LOGIN_PATH = "/accounts/login";
const DEFAULT_TTL_MINUTES = Number(import.meta?.env?.VITE_AUTH_TTL_MINUTES || 45);
const DEFAULT_TTL_MS = Math.max(1, DEFAULT_TTL_MINUTES) * 60 * 1000;

const SESSION_KEYS_TO_CLEAR = [
  AUTH_TOKEN_KEY,
  LEGACY_TOKEN_KEY,
  AUTH_EXPIRY_KEY,
  "pfNo",
];

let interceptorsInitialized = false;
let hasRedirectedToLogin = false;

const getCurrentPath = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.pathname;
};

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (getCurrentPath() === LOGIN_PATH || hasRedirectedToLogin) {
    return;
  }

  hasRedirectedToLogin = true;
  window.location.replace(LOGIN_PATH);
};

const getStoredToken = () => {
  const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  const token = authToken || legacyToken;

  if (token && !authToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  if (token && !legacyToken) {
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
  }

  return token;
};

const normalizeExpiry = () => {
  const rawExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  const parsedExpiry = Number(rawExpiry);

  if (!rawExpiry || Number.isNaN(parsedExpiry) || parsedExpiry <= 0) {
    const fallbackExpiry = Date.now() + DEFAULT_TTL_MS;
    localStorage.setItem(AUTH_EXPIRY_KEY, String(fallbackExpiry));
    return fallbackExpiry;
  }

  return parsedExpiry;
};

export const setAuthSession = (token, ttlMs = DEFAULT_TTL_MS) => {
  if (!token) {
    return;
  }

  const safeTtlMs = Math.max(1, Number(ttlMs) || DEFAULT_TTL_MS);
  const expiry = Date.now() + safeTtlMs;

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
  localStorage.setItem(AUTH_EXPIRY_KEY, String(expiry));
  hasRedirectedToLogin = false;
};

export const clearAuthSession = () => {
  SESSION_KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));
};

export const isSessionExpired = () => {
  const token = getStoredToken();
  if (!token) {
    return true;
  }

  const expiry = normalizeExpiry();
  return Date.now() >= expiry;
};

export const getValidAuthToken = () => {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  if (isSessionExpired()) {
    clearAuthSession();
    return null;
  }

  return token;
};

export const enforceSessionOrRedirect = () => {
  const token = getValidAuthToken();
  if (!token) {
    redirectToLogin();
    return null;
  }

  return token;
};

export const clearSessionAndRedirect = () => {
  clearAuthSession();
  redirectToLogin();
};

export const setupAxiosAuthInterceptors = () => {
  if (interceptorsInitialized) {
    return;
  }

  interceptorsInitialized = true;

  axios.interceptors.request.use(
    (config) => {
      const token = getValidAuthToken();
      const isLoginRequest = config?.url?.includes("/api/auth/login/");

      if (!token && !isLoginRequest) {
        if (getCurrentPath() !== LOGIN_PATH) {
          clearSessionAndRedirect();
        }
      }

      if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Token ${token}`;
        }
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode = error?.response?.status;
      if (statusCode === 401) {
        clearSessionAndRedirect();
      }
      return Promise.reject(error);
    },
  );
};
