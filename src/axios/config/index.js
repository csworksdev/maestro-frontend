import axios from "axios";
import { AUTH_COOKIE_KEYS, getCookie } from "@/utils/authCookies";
import {
  logOut,
  setUser,
  useAuthStore,
} from "@/redux/slicers/authSlice";

const baseURL = import.meta.env.VITE_API_URL;

// Helper ambil token
const getToken = () => {
  const { access } = useAuthStore.getState();
  if (access) return access;
  return getCookie(AUTH_COOKIE_KEYS.access);
};

const getRefreshToken = () => {
  const { refresh } = useAuthStore.getState();
  return refresh || getCookie(AUTH_COOKIE_KEYS.refresh);
};

let refreshPromise = null;

export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh = getRefreshToken();

  if (!refresh) {
    logOut();
    return Promise.reject(new Error("Missing refresh token"));
  }

  refreshPromise = axios
    .post(`${baseURL}/auth/token/refresh/`, {
      refresh,
    })
    .then((res) => {
      const newAccess = res.data.access;
      const state = useAuthStore.getState();
      setUser({
        refresh,
        access: newAccess,
        data: state.data,
        rememberMe: state.rememberMe,
      });
      return newAccess;
    })
    .catch((err) => {
      logOut();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const configuredIntervalMinutes = parseNumber(
  import.meta.env.VITE_TOKEN_REFRESH_INTERVAL_MINUTES
);
const configuredIntervalMs = parseNumber(
  import.meta.env.VITE_TOKEN_REFRESH_INTERVAL_MS
);

let autoRefreshIntervalMs = null;
if (configuredIntervalMinutes != null) {
  autoRefreshIntervalMs = configuredIntervalMinutes * 60 * 1000;
} else if (configuredIntervalMs != null) {
  autoRefreshIntervalMs = configuredIntervalMs;
}

const AUTO_REFRESH_INTERVAL_MS =
  autoRefreshIntervalMs && autoRefreshIntervalMs > 0
    ? autoRefreshIntervalMs
    : null;

const refreshBufferSeconds = parseNumber(
  import.meta.env.VITE_TOKEN_REFRESH_BUFFER_SECONDS
);
const REFRESH_BUFFER_MS =
  (refreshBufferSeconds != null ? refreshBufferSeconds : 60) * 1000;

const MIN_REFRESH_DELAY_MS = 5000;

const decodeJwtPayload = (token) => {
  try {
    const parts = token?.split(".") || [];
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padding);

    const decoded =
      typeof atob === "function"
        ? atob(padded)
        : typeof Buffer !== "undefined"
        ? Buffer.from(padded, "base64").toString("utf-8")
        : null;

    return decoded ? JSON.parse(decoded) : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Unable to decode access token payload", error);
    }
    return null;
  }
};

const getAccessExpiryDelay = (accessToken) => {
  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) {
    return null;
  }

  const expiryMs = Number(payload.exp) * 1000;
  if (!Number.isFinite(expiryMs)) {
    return null;
  }

  const msUntilExpiry = expiryMs - Date.now() - REFRESH_BUFFER_MS;
  if (msUntilExpiry <= 0) {
    return MIN_REFRESH_DELAY_MS;
  }

  return Math.max(msUntilExpiry, MIN_REFRESH_DELAY_MS);
};

let refreshTimerId = null;
let unsubscribeFromStore = null;

const clearRefreshTimer = () => {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
};

const computeNextRefreshDelay = () => {
  const delays = [];
  const accessToken = getToken();

  if (AUTO_REFRESH_INTERVAL_MS) {
    delays.push(AUTO_REFRESH_INTERVAL_MS);
  }

  const expiryDelay = accessToken ? getAccessExpiryDelay(accessToken) : null;
  if (expiryDelay != null) {
    delays.push(expiryDelay);
  }

  const validDelays = delays.filter(
    (delay) => Number.isFinite(delay) && delay > 0
  );

  if (!validDelays.length) {
    return null;
  }

  return Math.max(Math.min(...validDelays), MIN_REFRESH_DELAY_MS);
};

const scheduleAutoRefresh = () => {
  clearRefreshTimer();

  if (!getRefreshToken()) {
    return;
  }

  const nextDelay = computeNextRefreshDelay();
  if (!nextDelay) {
    return;
  }

  refreshTimerId = setTimeout(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Automatic access token refresh failed", error);
      }
    } finally {
      scheduleAutoRefresh();
    }
  }, nextDelay);
};

const ensureStoreSubscription = () => {
  if (unsubscribeFromStore) {
    return;
  }

  unsubscribeFromStore = useAuthStore.subscribe(
    (nextState, previousState) => {
      if (
        nextState.access !== previousState.access ||
        nextState.refresh !== previousState.refresh
      ) {
        scheduleAutoRefresh();
      }
    }
  );
};

export const initializeTokenRefreshScheduler = () => {
  if (typeof window === "undefined") {
    return;
  }

  ensureStoreSubscription();
  scheduleAutoRefresh();
};

export const axiosConfig = axios.create({
  baseURL,
});

// Request interceptor → inject token
axiosConfig.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// refresh token
axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccess = await refreshAccessToken();

        // update header request lama
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

        return axiosConfig(originalRequest);
      } catch (err) {
        logOut();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
