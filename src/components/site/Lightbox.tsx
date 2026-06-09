import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Photo } from "@/lib/queries";

interface LightboxProps {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
}

export function Lightbox({ photos, index, onClose, onChange }: LightboxProps) {
  const open = index !== null && photos[index];

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, photos.length, onClose, onChange]);

  return (
    <AnimatePresence>
      {open && index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center p-4 md:p-12"
          onClick={onClose}
        >
          <button
            aria-label="Close"
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2"
            onClick={onClose}
          >
            <X size={24} />
          </button>
          <button
            aria-label="Previous"
            className="absolute left-4 md:left-8 text-white/70 hover:text-white p-3"
            onClick={(e) => { e.stopPropagation(); onChange((index - 1 + photos.length) % photos.length); }}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            aria-label="Next"
            className="absolute right-4 md:right-8 text-white/70 hover:text-white p-3"
            onClick={(e) => { e.stopPropagation(); onChange((index + 1) % photos.length); }}
          >
            <ChevronRight size={28} />
          </button>

          <motion.img
            key={photos[index].id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            src={photos[index].public_url}
            alt={photos[index].alt_text}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
