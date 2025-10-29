import DOMPurify from "dompurify";

const defaultConfig = {
  USE_PROFILES: { html: true },
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel|sms|ftp|ftps|data:image\/(?:png|gif|jpeg|webp));|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export const sanitizeHtml = (dirty) => {
  if (!dirty) {
    return "";
  }

  if (typeof window === "undefined") {
    return dirty;
  }

  return DOMPurify.sanitize(dirty, defaultConfig);
};

export default sanitizeHtml;
