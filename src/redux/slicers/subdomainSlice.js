import { create } from "zustand";

const computeSubdomain = () => {
  const hostname = window.location.hostname;
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
