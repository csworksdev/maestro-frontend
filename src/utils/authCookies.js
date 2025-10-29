const COOKIE_LIFETIME_DAYS = 30;

const isBrowser = () => typeof document !== "undefined";
const isSecureContext = () =>
  typeof window !== "undefined" && window.location.protocol === "https:";

const buildCookieAttributes = (days) => {
  const attributes = ["path=/", "SameSite=Strict"];

  if (typeof days === "number") {
    attributes.push(`expires=${new Date(Date.now() + days * 864e5).toUTCString()}`);
  }

  if (isSecureContext()) {
    attributes.push("Secure");
  }

  return attributes.map((attr) => `;${attr}`).join("");
};

export const setCookie = (name, value, days = COOKIE_LIFETIME_DAYS) => {
  if (!isBrowser()) return;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}${buildCookieAttributes(days)}`;
};

export const getCookie = (name) => {
  if (!isBrowser()) return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export const deleteCookie = (name) => {
  if (!isBrowser()) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT${buildCookieAttributes()}`;
};

export const AUTH_COOKIE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  data: "user_data",
};

export const REMEMBER_ME_COOKIE = "remember_me";
export const FCM_TOKEN_COOKIE = "fcm_token";

export const getRememberMeCookie = () => {
  const value = getCookie(REMEMBER_ME_COOKIE);
  if (value == null) return null;
  return value === "1";
};

export const setRememberMeCookie = (remember, days = COOKIE_LIFETIME_DAYS) => {
  if (!isBrowser()) return;
  if (remember) {
    setCookie(REMEMBER_ME_COOKIE, "1", days);
  } else {
    setCookie(REMEMBER_ME_COOKIE, "0", null);
  }
};

export const setAuthCookies = ({ access, refresh, data }, options = {}) => {
  const { days = COOKIE_LIFETIME_DAYS } = options;
  if (access) setCookie(AUTH_COOKIE_KEYS.access, access, days);
  if (refresh) setCookie(AUTH_COOKIE_KEYS.refresh, refresh, days);
  if (data) setCookie(AUTH_COOKIE_KEYS.data, JSON.stringify(data), days);
};

export const clearAuthCookies = () => {
  Object.values(AUTH_COOKIE_KEYS).forEach(deleteCookie);
  deleteCookie(REMEMBER_ME_COOKIE);
};

export const getAuthCookies = () => {
  const access = getCookie(AUTH_COOKIE_KEYS.access) || "";
  const refresh = getCookie(AUTH_COOKIE_KEYS.refresh) || "";
  const rawData = getCookie(AUTH_COOKIE_KEYS.data);
  let data = null;

  if (rawData) {
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      console.error("Failed to parse user_data cookie:", error);
      deleteCookie(AUTH_COOKIE_KEYS.data);
    }
  }

  return { access, refresh, data };
};

export const clearAllCookies = () => {
  if (!isBrowser()) return;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  cookies.forEach((cookie) => {
    const [name] = cookie.split("=");
    if (!name) return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT${buildCookieAttributes()}`;
  });
};

export const getFcmTokenCookie = () => getCookie(FCM_TOKEN_COOKIE);

export const setFcmTokenCookie = (token, days = COOKIE_LIFETIME_DAYS) => {
  if (!token) {
    deleteCookie(FCM_TOKEN_COOKIE);
    return;
  }
  setCookie(FCM_TOKEN_COOKIE, token, days);
};

export const deleteFcmTokenCookie = () => {
  deleteCookie(FCM_TOKEN_COOKIE);
};
