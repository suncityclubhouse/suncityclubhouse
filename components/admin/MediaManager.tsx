"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Trash2, MoveUp, MoveDown, ImagePlus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMediaItem, reorderMediaItems, addMediaItem } from "@/actions/media";
import type { FacilityMedia } from "@/types/database";

interface MediaManagerProps {
  facilityId: string;
  initialMedia: FacilityMedia[];
}

export function MediaManager({ facilityId, initialMedia }: MediaManagerProps) {
  const [media, setMedia] = useState<FacilityMedia[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Upload new images ──────────────────────────────── */
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const slots = 10 - media.length;
    const toUpload = Array.from(files).slice(0, Math.max(slots, 0));

    if (toUpload.length === 0) {
      setError("Maximum 10 media items allowed.");
      setUploading(false);
      return;
    }

    const results: FacilityMedia[] = [];

    for (const file of toUpload) {
      const isVideo = file.type.startsWith("video") || !!file.name.toLowerCase().match(/\.(mp4|mov|hevc)$/);
      const maxSize = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Max ${isVideo ? "25MB" : "10MB"}.`);
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.url) throw new Error(json.error ?? "Upload failed");

        const displayOrder = media.length + results.length;
        const isVideo = file.type.startsWith("video") || !!file.name.toLowerCase().match(/\.(mp4|mov|hevc)$/);
        const mediaType: "image" | "video" = isVideo ? "video" : "image";

        const result = await addMediaItem({
          facilityId,
          url: json.url,
          publicId: json.publicId ?? json.public_id ?? "",
          mediaType,
          displayOrder,
        });

        if (!result.success) throw new Error(result.error);

        results.push({
          id: result.data!.id,
          facility_id: facilityId,
          url: json.url,
          public_id: json.publicId ?? "",
          media_type: mediaType,
          display_order: displayOrder,
          created_at: new Date().toISOString(),
        } as FacilityMedia);
      } catch (err: any) {
        setError(err.message ?? "Failed to upload one or more images");
      }
    }

    setMedia((prev) => [...prev, ...results]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ── Delete image ───────────────────────────────────── */
  async function handleDelete(item: FacilityMedia) {
    setBusy(true);
    await deleteMediaItem(item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    setBusy(false);
  }

  /* ── Reorder ────────────────────────────────────────── */
  async function move(index: number, direction: "up" | "down") {
    const next = [...media];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];

    const updated = next.map((item, i) => ({ ...item, display_order: i }));
    setMedia(updated);

    setBusy(true);
    await reorderMediaItems(updated.map((m) => ({ id: m.id, display_order: m.display_order })));
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,.heic,.HEIC,.heif,.HEIF,.hevc,.HEVC,.mov,.MOV"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || media.length >= 10}
          className="w-full border-dashed border-2 h-24 gap-3 text-stone-500 hover:text-stone-800 hover:border-amber-400 transition-all flex-col"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-6 h-6" />
              <span>
                {media.length === 0
                  ? "Click to upload facility images / videos"
                  : `Add more media (${media.length}/10 used)`}
              </span>
            </>
          )}
        </Button>
        <p className="text-xs text-stone-400 mt-1.5 pl-1">
          Supports JPG, PNG, WebP, MP4, MOV, HEVC. First image is the gallery cover shown to users. Max 10 files.
        </p>
      </div>

      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {media.map((item, i) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-video shadow-sm"
            >
              {item.media_type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <Image
                  src={item.url}
                  alt={`Media ${i + 1}`}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              )}

              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  Cover
                </span>
              )}

              {/* Index */}
              <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                {i + 1}
              </span>

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => move(i, "up")}
                  disabled={i === 0 || busy}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white disabled:opacity-30 transition-colors"
                  title="Move left"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, "down")}
                  disabled={i === media.length - 1 || busy}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white disabled:opacity-30 transition-colors"
                  title="Move right"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={busy}
                  className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {media.length === 0 && !uploading && (
        <div className="text-center py-6 text-stone-400 text-sm border border-dashed border-stone-200 rounded-xl">
          No images uploaded yet. Add images for users to see in the facility gallery.
        </div>
      )}
    </div>
  );
}
