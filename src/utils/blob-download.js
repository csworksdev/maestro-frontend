export const getFilenameFromContentDisposition = (contentDisposition) => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Filename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Filename?.[1]) {
    return decodeURIComponent(utf8Filename[1].replace(/["']/g, ""));
  }

  const fallbackFilename = contentDisposition.match(/filename="?([^"]+)"?/i);
  return fallbackFilename?.[1] || null;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
};

export const downloadBlobResponse = (response, fallbackFilename) => {
  const contentType =
    response?.headers?.["content-type"] || "application/octet-stream";
  const filename =
    getFilenameFromContentDisposition(
      response?.headers?.["content-disposition"]
    ) || fallbackFilename;
  const blob =
    response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], { type: contentType });

  downloadBlob(blob, filename);
};
