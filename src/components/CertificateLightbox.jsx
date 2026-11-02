import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function CertificateLightbox({ cert, onClose }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden"; // Lock scroll
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  if (!cert) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] bg-[#05060a] border border-white/10 p-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-[#ff5a3c] transition-colors"
        >
          <X size={32} />
        </button>

        <img
          src={cert.image}
          alt={cert.title}
          style={{ transform: `scale(${scale})` }}
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
        />

        <div className="absolute bottom-4 left-4 flex gap-2">
          <button onClick={() => setScale((s) => Math.min(s + 0.5, 3))} className="p-2 bg-black/50 text-white hover:text-[#ff5a3c]"><ZoomIn /></button>
          <button onClick={() => setScale((s) => Math.max(s - 0.5, 1))} className="p-2 bg-black/50 text-white hover:text-[#ff5a3c]"><ZoomOut /></button>
          <button onClick={() => setScale(1)} className="p-2 bg-black/50 text-white hover:text-[#ff5a3c]"><Maximize2 /></button>
        </div>
      </div>
    </div>
  );
}
