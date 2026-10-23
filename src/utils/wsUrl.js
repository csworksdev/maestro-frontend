const ABSOLUTE_WS_REGEX = /^wss?:\/\//i;

const stripTrailingSlash = (value = "") =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const coerceWsProtocol = (value) => {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    }

    if (
      typeof window !== "undefined" &&
      window.location?.protocol === "https:" &&
      url.protocol === "ws:"
    ) {
      url.protocol = "wss:";
    }

    url.hash = "";
    return stripTrailingSlash(url.toString());
  } catch {
    return null;
  }
};

export const resolveWsBaseUrl = () => {
  const envValue = import.meta.env.VITE_API_WS;
  if (envValue && envValue.trim().length) {
    const normalized = coerceWsProtocol(envValue.trim());
    if (normalized) {
      return normalized;
    }
  }

  if (typeof window !== "undefined" && window.location) {
    const { protocol, host } = window.location;
    const wsProtocol = protocol === "https:" ? "wss" : "ws";
    return `${wsProtocol}://${host}`;
  }

  return null;
};

export const buildWsUrl = (endpoint = "") => {
  if (!endpoint) {
    return null;
  }

  if (ABSOLUTE_WS_REGEX.test(endpoint)) {
    return coerceWsProtocol(endpoint);
  }

  const baseUrl = resolveWsBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${stripTrailingSlash(baseUrl)}${normalizedPath}`;
};
