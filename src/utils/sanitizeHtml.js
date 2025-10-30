import DOMPurify from "dompurify";

const DISALLOWED_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "meta",
  "base",
  "link",
  "template",
];

const DISALLOWED_ATTRS = ["style", "srcdoc", "onerror"];
const URL_ATTRS = ["href", "src", "xlink:href", "formaction", "poster"];

const defaultConfig = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: DISALLOWED_TAGS,
  FORBID_ATTR: DISALLOWED_ATTRS,
  ALLOWED_URI_REGEXP: /^(?:(?:https?):|#)/i,
  RETURN_DOM: false,
};

if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    URL_ATTRS.forEach((attr) => {
      if (!node.hasAttribute || !node.hasAttribute(attr)) {
        return;
      }

      const rawValue = node.getAttribute(attr);
      if (!rawValue) {
        node.removeAttribute(attr);
        return;
      }

      const value = rawValue.trim();
      if (!value || value.startsWith("#")) {
        return;
      }

      if (value.startsWith("//")) {
        node.removeAttribute(attr);
        return;
      }

      try {
        const parsed = new URL(value, window.location.origin);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          node.removeAttribute(attr);
        }
      } catch (error) {
        node.removeAttribute(attr);
      }
    });
  });
}

export const sanitizeHtml = (dirty) => {
  if (typeof dirty !== "string" || !dirty.trim()) {
    return "";
  }

  if (typeof window === "undefined") {
    return dirty;
  }

  return DOMPurify.sanitize(dirty, defaultConfig);
};

export default sanitizeHtml;
