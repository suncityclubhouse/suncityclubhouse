"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import type { FacilityMedia } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";

interface FacilityGalleryProps {
  media: FacilityMedia[];
  facilityName: string;
}

const smoothEase = [0.16, 1, 0.3, 1] as const;

export function FacilityGallery({ media, facilityName }: FacilityGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (media.length === 0) return null;

  const active = media[activeIndex];

  const prev = () => setActiveIndex((i) => (i === 0 ? media.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === media.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Main gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: smoothEase }}
        className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {active.media_type === "video" ? (
              <video
                src={active.url}
                controls
                className="w-full h-full object-cover"
                poster={media.find((m) => m.media_type === "image")?.url}
              />
            ) : (
              <>
                <Image
                  src={active.url}
                  alt={`${facilityName} — photo ${activeIndex + 1}`}
                  fill
                  sizes="(max-width:768px) 100vw, 70vw"
                  className="object-cover"
                  priority={activeIndex === 0}
                />
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg transition-colors"
                  aria-label="Open fullscreen"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md p-2 rounded-full transition-all hover:scale-110 z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md p-2 rounded-full transition-all hover:scale-110 z-10"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </>
        )}

        {/* Counter */}
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10">
          {activeIndex + 1} / {media.length}
        </span>
      </motion.div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: smoothEase, delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin mt-3"
        >
          {media.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                i === activeIndex
                  ? "border-blue-600 opacity-100 scale-105"
                  : "border-transparent opacity-60 hover:opacity-90"
              )}
            >
              {item.media_type === "video" ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </motion.div>
      )}

      {/* Lightbox — animated with Framer Motion */}
      <AnimatePresence>
        {lightboxOpen && active.media_type === "image" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </motion.button>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: smoothEase }}
              className="relative max-w-5xl w-full max-h-[90vh] aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={active.url}
                alt={facilityName}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
