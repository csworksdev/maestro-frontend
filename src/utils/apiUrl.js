export const DEV_DEPLOYMENT_API_URL = "https://api-dev.maestroswim.com";

const DEV_DEPLOYMENT_HOST_SUFFIX = ".dev.maestroswim.com";

const stripTrailingSlash = (value = "") => value.replace(/\/+$/, "");

// A Vite mode is not evidence that a deployed static site has a proxy.
export const isLocalApiProxy = ({
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
  isViteDev = import.meta.env.DEV,
} = {}) => isViteDev && (
  hostname === "localhost" || hostname.endsWith(".localhost") ||
  hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]"
);

export const validateApiBaseUrl = (value, name = "VITE_API_URL") => {
  const normalized = stripTrailingSlash(String(value || "").trim());
  try {
    const url = new URL(normalized);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error("Invalid API URL");
    }
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) API URL`);
  }
  return normalized;
};

export const isDevDeploymentHost = (hostname = "") =>
  hostname.toLowerCase().endsWith(DEV_DEPLOYMENT_HOST_SUFFIX);

export const resolveApiBaseUrl = ({
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
  isViteDev = import.meta.env.DEV,
  envApiUrl = import.meta.env.VITE_API_URL,
} = {}) => {
  if (isLocalApiProxy({ hostname, isViteDev })) {
    return "/__api";
  }

  if (isDevDeploymentHost(hostname)) {
    return DEV_DEPLOYMENT_API_URL;
  }

  const baseUrl = validateApiBaseUrl(envApiUrl);
  if (new URL(baseUrl).hostname === hostname) {
    throw new Error("VITE_API_URL must point to the backend, not the frontend host");
  }
  return baseUrl;
};

export const resolveAccessApiBaseUrl = ({
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
  isViteDev = import.meta.env.DEV,
  envAccessApiUrl = import.meta.env.VITE_ACCESS_API_URL,
  envApiUrl = import.meta.env.VITE_API_URL,
} = {}) => {
  if (isLocalApiProxy({ hostname, isViteDev })) {
    return "/__access-api";
  }

  if (isDevDeploymentHost(hostname)) {
    return DEV_DEPLOYMENT_API_URL;
  }

  return resolveApiBaseUrl({
    hostname,
    isViteDev,
    envApiUrl: envAccessApiUrl || envApiUrl,
  });
};
