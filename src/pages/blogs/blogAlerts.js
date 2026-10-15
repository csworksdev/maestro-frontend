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

export const getBlogErrorMessage = (error, fallback) => {
  if (error?.code === "ECONNABORTED") {
    return "Permintaan terlalu lama. Periksa koneksi internet lalu coba lagi.";
  }
  if (!error?.response) {
    return "Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.";
  }

  const data = error.response.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }
  return fallback;
};
