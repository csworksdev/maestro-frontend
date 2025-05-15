export const toNormalizePhone = (phone) => {
  if (!phone) return "";
  // Hilangkan spasi, strip, dan titik
  let cleaned = phone.replace(/[\s\-.]/g, "");
  // Jika diawali dengan 0, ganti dengan +62
  if (cleaned.startsWith("0")) {
    cleaned = "+62" + cleaned.slice(1);
  }
  // Jika sudah diawali +62, biarkan saja
  return cleaned;
};
