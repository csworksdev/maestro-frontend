import DOMPurify from "dompurify";

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export const normalizeCareerRichText = (value) => {
  const text = String(value || "");
  if (!text.trim()) return "";

  // Older jobs can contain plain text with newlines instead of HTML.
  if (!/<\/?[a-z][^>]*>/i.test(text)) {
    return escapeHtml(text).replace(/\r\n?|\n/g, "<br>");
  }

  return text;
};

export const sanitizeCareerRichText = (value) => {
  const safeHtml = DOMPurify.sanitize(normalizeCareerRichText(value), {
    USE_PROFILES: { html: true },
  });
  const container = document.createElement("div");
  container.innerHTML = safeHtml;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const content = node.textContent;
    if (!content || !/\r|\n/.test(content) || !content.trim()) return;

    const lines = content.split(/\r\n?|\n/);
    const fragment = document.createDocumentFragment();
    let hasContent = false;
    lines.forEach((line, index) => {
      if (index > 0 && hasContent) {
        fragment.appendChild(document.createElement("br"));
      }
      fragment.appendChild(document.createTextNode(line));
      if (line.trim()) hasContent = true;
    });
    node.replaceWith(fragment);
  });

  return container.innerHTML.trim();
};

export const hasCareerRichText = (value) => {
  const container = document.createElement("div");
  container.innerHTML = sanitizeCareerRichText(value);
  return Boolean(container.textContent?.replace(/\u00a0/g, " ").trim());
};

export const countCareerParagraphs = (value) => {
  if (!hasCareerRichText(value)) return 0;
  const container = document.createElement("div");
  container.innerHTML = sanitizeCareerRichText(value);
  const blocks = container.querySelectorAll("p, li, blockquote, h1, h2, h3");
  return blocks.length || 1;
};

export const getCareerRichTextLines = (value) => {
  const container = document.createElement("div");
  container.innerHTML = sanitizeCareerRichText(value);
  let text = "";

  const visit = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") {
      text += "\n";
      return;
    }

    Array.from(node.childNodes).forEach(visit);
    if (/^(P|DIV|LI|H[1-6]|BLOCKQUOTE)$/.test(node.tagName)) {
      text += "\n";
    }
  };

  Array.from(container.childNodes).forEach(visit);
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
};

export const countCareerLines = (value) =>
  hasCareerRichText(value) ? getCareerRichTextLines(value).split("\n").length : 0;

const getCareerRichTextFormatting = (value) => {
  const container = document.createElement("div");
  container.innerHTML = sanitizeCareerRichText(value);
  const formatTags = new Set([
    "STRONG", "B", "EM", "I", "U", "S", "H1", "H2", "H3", "UL", "OL", "LI",
    "BLOCKQUOTE", "A", "CODE", "PRE",
  ]);

  return Array.from(container.querySelectorAll("*"))
    .filter((element) =>
      formatTags.has(element.tagName) ||
      element.hasAttribute("class") ||
      element.hasAttribute("style"),
    )
    .map((element) => [
      element.tagName === "B" ? "STRONG" : element.tagName === "I" ? "EM" : element.tagName,
      element.getAttribute("class") || "",
      element.getAttribute("style") || "",
      element.getAttribute("href") || "",
    ]);
};

export const isCareerRichTextPreserved = (submitted, persisted) =>
  getCareerRichTextLines(submitted) === getCareerRichTextLines(persisted) &&
  JSON.stringify(getCareerRichTextFormatting(submitted)) ===
    JSON.stringify(getCareerRichTextFormatting(persisted));
