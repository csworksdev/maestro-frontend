export const PRODUCTION_API_MEDIA_URL = "https://api.maestroswim.com";
export const PRODUCTION_STORAGE_MEDIA_URL = "https://media.maestroswim.com";

const ABSOLUTE_HTTP_URL = /^https?:\/\//i;
const NON_MEDIA_SCHEME = /^(?:mailto:|tel:|whatsapp:|data:|blob:)/i;

export const resolveProductionMediaUrl = (value) => {
  const rawValue = String(value ?? "").trim();
  if (!rawValue || NON_MEDIA_SCHEME.test(rawValue)) return rawValue;

  const markdownUrl = rawValue.match(/\((https?:\/\/[^)]+)\)/)?.[1];
  const candidate = markdownUrl || rawValue;

  if (!ABSOLUTE_HTTP_URL.test(candidate)) {
    return `${PRODUCTION_STORAGE_MEDIA_URL}/${candidate.replace(/^\/+/, "")}`;
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1"
    ) {
      const productionPath = url.pathname.replace(/^\/__(?:api|access-api)/, "");
      return `${PRODUCTION_API_MEDIA_URL}${productionPath}${url.search}${url.hash}`;
    }

    if (hostname === "api-dev.maestroswim.com") {
      url.hostname = "api.maestroswim.com";
      return url.toString();
    }

    if (hostname === "media-dev.maestroswim.com") {
      url.hostname = "media.maestroswim.com";
      return url.toString();
    }

    return url.toString();
  } catch {
    return candidate;
  }
};
