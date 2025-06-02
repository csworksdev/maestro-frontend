import { useRef } from "react";

export function useWhatsAppTab() {
  const waTabRef = useRef(null);

  const openWhatsApp = () => {
    if (!waTabRef.current || waTabRef.current.closed) {
      waTabRef.current = window.open("https://web.whatsapp.com", "whatsappTab");
      if (!waTabRef.current) {
        alert("Popup blocked. Please allow popups for this site.");
      }
    } else {
      waTabRef.current.focus();
    }
  };

  const sendMessage = (phone, message) => {
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      message
    )}`;
    if (waTabRef.current && !waTabRef.current.closed) {
      waTabRef.current.location.href = url;
      waTabRef.current.focus();
    } else {
      waTabRef.current = window.open(url, "whatsappTab");
      if (!waTabRef.current) {
        alert("Popup blocked. Please allow popups for this site.");
      }
    }
  };

  return { openWhatsApp, sendMessage };
}
