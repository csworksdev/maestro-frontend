import { create } from "zustand";

const computeSubdomain = () => {
  const hostname = window.location.hostname.toLowerCase();
  const defaultSubdomain = import.meta.env.VITE_DEFAULT_SUBDOMAIN;

  if (hostname.endsWith(".netlify.app") && defaultSubdomain) {
    return defaultSubdomain;
  }

  let subdomain = hostname.split(".")[0];
  if (subdomain.startsWith("dev")) {
    subdomain = subdomain.replace("dev", "");
  }
  return subdomain;
};

export const useSubdomainStore = create(() => ({
  subdomain: computeSubdomain(),
}));

export const getSubdomain = () => useSubdomainStore.getState().subdomain;
