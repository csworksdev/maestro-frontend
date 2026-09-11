const humanizeKey = (key) =>
  String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const stringifyValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifyValue).filter(Boolean).join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        const text = stringifyValue(item);
        return text ? `${humanizeKey(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return String(value);
};

const translateCareerMessage = (message) => {
  const text = String(message || "").trim();
  const knownMessages = {
    "Trainer already exists for this application.":
      "Pelamar ini sudah terdaftar sebagai pelatih.",
    "Hanya lamaran dengan status Pending yang dapat diproses":
      "Hanya lamaran dengan status Pending yang dapat diproses.",
    "Belum ada tahapan rekrutmen yang dikonfigurasi untuk departemen ini.":
      "Belum ada tahapan rekrutmen yang tersedia untuk department ini.",
    "Network Error":
      "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.",
  };

  return knownMessages[text] || text;
};

const isTechnicalMessage = (text) => {
  const value = String(text || "");

  return (
    value.length > 400 ||
    /(?:<!doctype|<html|<body|<style|traceback|stack trace|operationalerror|programmingerror|integrityerror|databaseerror|django version|exception type|exception value|request method|request url|python executable|python version|python path|server time|psycopg|sqlstate|connection to server|localhost|127\.0\.0\.1|\/site-packages\/|\.py,? line \d+)/i.test(value) ||
    /^(?:error|exception|failed|failure|fetch|network|timeout|request|axios|typeerror|syntaxerror|cannot read|undefined|null|format|internal server|bad gateway|service unavailable|gateway timeout|request failed|load failed|econn|err_|not found|no data|unauthorized|forbidden|something went wrong|server error)/i.test(value)
  );
};

const getCareerErrorMessage = (error, fallback = "Data belum dapat ditampilkan. Silakan coba lagi.") => {
  const data = error?.response?.data ?? error?.data ?? error;
  const status = error?.response?.status;
  const errorCode = String(error?.code || "").toUpperCase();
  const contentType = String(error?.response?.headers?.["content-type"] || "");
  const message =
    data?.message || data?.detail || data?.error || data?.errors || data;
  const rawText = stringifyValue(message).trim();
  const text = translateCareerMessage(
    rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  );

  if (status === 400) {
    if (text && !isTechnicalMessage(text)) return text;
    return "Data yang dikirim belum benar. Periksa kembali isian Anda.";
  }

  if (status === 401) {
    return "Sesi Anda telah berakhir. Silakan masuk kembali.";
  }

  if (status === 403) {
    return "Anda tidak memiliki izin untuk melakukan aksi ini.";
  }

  if (status === 404) {
    return "Data yang diminta tidak ditemukan.";
  }

  if (status === 408 || errorCode === "ECONNABORTED" || errorCode === "ETIMEDOUT") {
    return "Server membutuhkan waktu terlalu lama untuk merespons. Silakan coba lagi.";
  }

  if (status === 429) {
    return "Permintaan sedang terlalu banyak. Tunggu sebentar lalu coba lagi.";
  }

  if (status >= 500) {
    return "Server sedang mengalami gangguan. Silakan coba lagi beberapa saat.";
  }

  if (errorCode === "ERR_NETWORK" || (error?.isAxiosError && !error?.response)) {
    return "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.";
  }

  if (!error?.response) return fallback;

  if (
    contentType.includes("text/html") ||
    isTechnicalMessage(rawText) ||
    /^request failed with status code \d+$/i.test(text)
  ) {
    return fallback;
  }

  if (text) return text;

  return fallback;
};

export default getCareerErrorMessage;
