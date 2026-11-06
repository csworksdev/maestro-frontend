import Swal from "sweetalert2";

export const confirmBlogAction = async ({
  title,
  text,
  confirmButtonText = "Ya, simpan",
  confirmButtonColor,
  icon = "question",
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Batal",
    reverseButtons: true,
    focusCancel: true,
    ...(confirmButtonColor ? { confirmButtonColor } : {}),
  });

  return result.isConfirmed;
};

export const showBlogLoading = (title, text) => {
  void Swal.fire({
    title,
    text,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
};

const SERVER_ERROR_MESSAGE =
  "Server sedang mengalami gangguan. Silakan coba lagi beberapa saat.";
const CONNECTION_ERROR_MESSAGE =
  "Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.";

const looksLikeTechnicalResponse = (value) => {
  if (typeof value !== "string") return false;
  const message = value.trim();

  return (
    !message ||
    message.length > 500 ||
    /<!doctype|<html|<head|<body|<script|<style|<div/i.test(message) ||
    /traceback|stack trace|sqlstate|syntaxerror|exception at|ngrok|err_[a-z0-9_]+/i.test(
      message,
    )
  );
};

const translateCommonMessage = (value) => {
  const message = String(value).trim();
  const normalized = message.toLowerCase().replace(/[.!]+$/, "");

  if (normalized === "this field is required") return "Kolom ini wajib diisi.";
  if (normalized === "not found") return "Data yang diminta tidak ditemukan.";
  if (normalized.includes("invalid token")) {
    return "Sesi Anda sudah tidak berlaku. Silakan masuk kembali.";
  }
  return message;
};

const findSafeApiMessage = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    const message = String(value).trim();
    return looksLikeTechnicalResponse(message)
      ? null
      : translateCommonMessage(message);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = findSafeApiMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const preferredKeys = ["detail", "message", "error", "non_field_errors"];
    for (const key of preferredKeys) {
      if (key in value) {
        const message = findSafeApiMessage(value[key]);
        if (message) return message;
      }
    }
    for (const nestedValue of Object.values(value)) {
      const message = findSafeApiMessage(nestedValue);
      if (message) return message;
    }
  }
  return null;
};

export const getBlogErrorMessage = (error, fallback) => {
  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    /timeout/i.test(error?.message || "")
  ) {
    return "Permintaan terlalu lama. Periksa koneksi internet lalu coba lagi.";
  }
  if (!error?.response) {
    return CONNECTION_ERROR_MESSAGE;
  }

  const status = Number(error.response.status);
  if (status === 401) {
    return "Sesi Anda telah berakhir. Silakan masuk kembali.";
  }
  if (status === 403) {
    return "Anda tidak memiliki akses untuk melakukan tindakan ini.";
  }
  if (status === 404) {
    return fallback || "Data yang diminta tidak ditemukan.";
  }
  if (status === 408) {
    return "Permintaan terlalu lama. Silakan coba lagi.";
  }
  if (status === 429) {
    return "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.";
  }
  if (status >= 500) {
    return SERVER_ERROR_MESSAGE;
  }

  return findSafeApiMessage(error.response.data) || fallback || SERVER_ERROR_MESSAGE;
};
