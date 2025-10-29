const COOKIE_LIFETIME_DAYS = 30;

const isBrowser = () => typeof document !== "undefined";
const isSecureContext = () =>
  typeof window !== "undefined" && window.location.protocol === "https:";

const DEFAULT_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "Lax",
};

const serializeCookie = (name, value, options = {}) => {
  const {
    expires,
    path = DEFAULT_COOKIE_OPTIONS.path,
    domain,
    sameSite = DEFAULT_COOKIE_OPTIONS.sameSite,
    secure,
    maxAge,
  } = options;

  const segments = [`${name}=${encodeURIComponent(value)}`, `path=${path}`];

  if (domain) {
    segments.push(`domain=${domain}`);
  }

  if (expires instanceof Date && !Number.isNaN(expires.valueOf())) {
    segments.push(`expires=${expires.toUTCString()}`);
  }

  if (typeof maxAge === "number") {
    segments.push(`Max-Age=${Math.trunc(maxAge)}`);
  }

  if (sameSite) {
    segments.push(`SameSite=${sameSite}`);
  }

  const httpsContext = isSecureContext();
  const requestedSecure = secure ?? httpsContext;

  if (requestedSecure && httpsContext) {
    segments.push("Secure");
  } else if (requestedSecure && !httpsContext && import.meta.env?.DEV) {
    console.warn(
      `Skipping Secure flag for cookie "${name}" because HTTPS is not enabled.`
    );
  }

  return segments.join(";");
};

export const setCookie = (
  name,
  value,
  days = COOKIE_LIFETIME_DAYS,
  options = {}
) => {
  if (!isBrowser()) return;

  const expires =
    typeof days === "number"
      ? new Date(Date.now() + days * 864e5)
      : options.expires;

  document.cookie = serializeCookie(name, value, {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options,
    expires,
  });
};

export const getCookie = (name) => {
  if (!isBrowser()) return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\/+^])/g, "\$1")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export const deleteCookie = (name, options = {}) => {
  if (!isBrowser()) return;
  document.cookie = serializeCookie(name, "", {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options,
    expires: new Date("Thu, 01 Jan 1970 00:00:00 GMT"),
  });
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

export const setRememberMeCookie = (
  remember,
  days = COOKIE_LIFETIME_DAYS
) => {
  if (!isBrowser()) return;
  const options = { sameSite: "Strict", secure: true };
  if (remember) {
    setCookie(REMEMBER_ME_COOKIE, "1", days, options);
  } else {
    setCookie(REMEMBER_ME_COOKIE, "0", null, options);
  }
};

export const setAuthCookies = ({ access, refresh, data }, options = {}) => {
  const { days = COOKIE_LIFETIME_DAYS } = options;
  const secureCookieOptions = { sameSite: "Strict", secure: true };

  if (access)
    setCookie(AUTH_COOKIE_KEYS.access, access, days, secureCookieOptions);
  if (refresh)
    setCookie(AUTH_COOKIE_KEYS.refresh, refresh, days, secureCookieOptions);
  if (data)
    setCookie(AUTH_COOKIE_KEYS.data, JSON.stringify(data), days, {
      sameSite: "Lax",
      secure: true,
    });
};

export const clearAuthCookies = () => {
  Object.values(AUTH_COOKIE_KEYS).forEach((key) =>
    deleteCookie(key, { sameSite: "Strict", secure: true })
  );
  deleteCookie(REMEMBER_ME_COOKIE, { sameSite: "Strict", secure: true });
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
      deleteCookie(AUTH_COOKIE_KEYS.data, { sameSite: "Lax", secure: true });
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
    deleteCookie(name.trim());
  });
};

export const getFcmTokenCookie = () => getCookie(FCM_TOKEN_COOKIE);

export const setFcmTokenCookie = (token, days = COOKIE_LIFETIME_DAYS) => {
  if (!token) {
    deleteCookie(FCM_TOKEN_COOKIE, { sameSite: "Lax", secure: true });
    return;
  }
  setCookie(FCM_TOKEN_COOKIE, token, days, { sameSite: "Lax", secure: true });
};

export const deleteFcmTokenCookie = () => {
  deleteCookie(FCM_TOKEN_COOKIE, { sameSite: "Lax", secure: true });
};
