import { useState } from "react";
import Icons from "../ui/Icon";

const CopyText = ({ text, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // reset setelah 1.5 detik
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="truncate">{text}</span>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition 
          ${
            copied
              ? "bg-green-500 text-white"
              : "text-blue-500 hover:text-blue-700"
          }`}
      >
        <Icons
          icon={
            copied
              ? "heroicons-outline:check"
              : "heroicons-outline:clipboard-copy"
          }
          className={`w-5 h-5 transition-transform duration-100 ${
            copied ? "scale-110" : ""
          }`}
        />
        <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
      </button>
    </div>
  );
};

export default CopyText;
