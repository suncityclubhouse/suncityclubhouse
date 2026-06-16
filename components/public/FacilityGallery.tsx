"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn, Pause } from "lucide-react";
import { cn, optimizeCloudinaryUrl } from "@/lib/utils/formatters";
import type { FacilityMedia } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";

interface FacilityGalleryProps {
  media: FacilityMedia[];
  facilityName: string;
}

const smoothEase = [0.16, 1, 0.3, 1] as const;
const SLIDE_INTERVAL_MS = 3000;

export function FacilityGallery({ media, facilityName }: FacilityGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (media.length === 0) return null;

  const active = media[activeIndex];
  const imageOnlyMedia = media.filter((m) => m.media_type === "image");
  const hasMultiple = media.length > 1;

  const prev = useCallback(
    () => setActiveIndex((i) => (i === 0 ? media.length - 1 : i - 1)),
    [media.length]
  );

  const next = useCallback(
    () => setActiveIndex((i) => (i === media.length - 1 ? 0 : i + 1)),
    [media.length]
  );

  // Auto-advance: skip videos (stay on them until user navigates)
  const startInterval = useCallback(() => {
    if (!hasMultiple) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((current) => {
        const currentItem = media[current];
        // Don't auto-advance away from a video
        if (currentItem.media_type === "video") return current;
        return current === media.length - 1 ? 0 : current + 1;
      });
    }, SLIDE_INTERVAL_MS);
  }, [hasMultiple, media]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPaused && !lightboxOpen) {
      startInterval();
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [isPaused, lightboxOpen, startInterval, stopInterval]);

  // Manual nav resets the 3s timer
  const handlePrev = () => {
    stopInterval();
    prev();
    if (!isPaused) startInterval();
  };

  const handleNext = () => {
    stopInterval();
    next();
    if (!isPaused) startInterval();
  };

  const handleThumbnailClick = (i: number) => {
    stopInterval();
    setActiveIndex(i);
    if (!isPaused) startInterval();
  };

  return (
    <>
      {/* Main gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: smoothEase }}
        className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
          >
            {active.media_type === "video" ? (
              <video
                src={optimizeCloudinaryUrl(active.url)}
                controls
                className="w-full h-full object-contain bg-black"
                poster={optimizeCloudinaryUrl(imageOnlyMedia[0]?.url)}
              />
            ) : (
              <>
                <Image
                  src={optimizeCloudinaryUrl(active.url)}
                  alt={`${facilityName} — photo ${activeIndex + 1}`}
                  fill
                  sizes="(max-width:768px) 100vw, 70vw"
                  className="object-contain"
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
        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md p-2 rounded-full transition-all hover:scale-110 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md p-2 rounded-full transition-all hover:scale-110 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </>
        )}

        {/* Progress dots + pause indicator */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => handleThumbnailClick(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "bg-white w-5 h-1.5"
                    : "bg-white/50 hover:bg-white/80 w-1.5 h-1.5"
                )}
              />
            ))}
          </div>
        )}

        {/* Pause indicator — shows briefly on hover */}
        {hasMultiple && isPaused && active.media_type !== "video" && (
          <div className="absolute top-3 left-3 bg-black/40 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 z-10 pointer-events-none">
            <Pause className="w-3 h-3" />
            Paused
          </div>
        )}

        {/* Counter */}
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10">
          {activeIndex + 1} / {media.length}
        </span>
      </motion.div>

      {/* Thumbnails */}
      {hasMultiple && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: smoothEase, delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin mt-3"
        >
          {media.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleThumbnailClick(i)}
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
                  src={optimizeCloudinaryUrl(item.url)}
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

      {/* Lightbox */}
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
                src={optimizeCloudinaryUrl(active.url)}
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
