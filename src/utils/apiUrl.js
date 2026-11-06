export const DEV_DEPLOYMENT_API_URL = "https://api-dev.maestroswim.com";

const DEV_DEPLOYMENT_HOST_SUFFIX = ".dev.maestroswim.com";

const stripTrailingSlash = (value = "") => value.replace(/\/+$/, "");

export const isDevDeploymentHost = (hostname = "") =>
  hostname.toLowerCase().endsWith(DEV_DEPLOYMENT_HOST_SUFFIX);

export const resolveApiBaseUrl = ({
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
  isViteDev = import.meta.env.DEV,
  envApiUrl = import.meta.env.VITE_API_URL,
} = {}) => {
  if (isViteDev) {
    return "/__api";
  }

  if (isDevDeploymentHost(hostname)) {
    return DEV_DEPLOYMENT_API_URL;
  }

  return stripTrailingSlash(String(envApiUrl || ""));
};

export const resolveAccessApiBaseUrl = ({
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
  isViteDev = import.meta.env.DEV,
  envAccessApiUrl = import.meta.env.VITE_ACCESS_API_URL,
  envApiUrl = import.meta.env.VITE_API_URL,
} = {}) => {
  if (isViteDev) {
    return "/__access-api";
  }

  if (isDevDeploymentHost(hostname)) {
    return DEV_DEPLOYMENT_API_URL;
  }

  return stripTrailingSlash(String(envAccessApiUrl || envApiUrl || ""));
};
