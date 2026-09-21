"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Users } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/utils/formatters";
import type { Facility, FacilityPackage } from "@/types/database";
import { motion } from "framer-motion";

interface FacilityCardProps {
  facility: Facility & {
    facility_packages?: Pick<FacilityPackage, "price" | "type">[];
  };
  index?: number;
}

const smoothEase = [0.16, 1, 0.3, 1] as const;

// Colour-coded by category — muted, professional
const CATEGORY_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  sports:        { dot: "bg-emerald-400",  bg: "bg-emerald-50/80",  text: "text-emerald-700" },
  event:         { dot: "bg-violet-400",   bg: "bg-violet-50/80",   text: "text-violet-700"  },
  accommodation: { dot: "bg-amber-400",    bg: "bg-amber-50/80",    text: "text-amber-700"   },
  recreation:    { dot: "bg-cyan-400",     bg: "bg-cyan-50/80",     text: "text-cyan-700"    },
  outdoor:       { dot: "bg-lime-400",     bg: "bg-lime-50/80",     text: "text-lime-700"    },
  general:       { dot: "bg-slate-400",    bg: "bg-white/80",       text: "text-slate-600"   },
};

function getCatStyle(cat: string) {
  return CATEGORY_STYLES[cat.toLowerCase()] ?? CATEGORY_STYLES.general;
}

export function FacilityCard({ facility, index = 0 }: FacilityCardProps) {
  const detailUrl = `/facilities/${facility.slug}`;
  const bookUrl   = `/facilities/${facility.slug}/book`;
  const catStyle  = getCatStyle(facility.category);


  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: smoothEase, delay: index * 0.08 }}
      className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 bg-white
                 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_36px_rgba(0,0,0,0.13)]
                 hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* ── Thumbnail ── */}
      <Link href={detailUrl} className="relative block h-52 overflow-hidden bg-slate-100 flex-shrink-0">
        {facility.thumbnail_url ? (
          <Image
            src={optimizeCloudinaryUrl(facility.thumbnail_url)}
            alt={facility.name}
            fill
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-slate-300 text-5xl font-serif">{facility.name.charAt(0)}</span>
          </div>
        )}

        {/* Category badge — colour-coded */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-medium
                          px-2.5 py-1 rounded-full capitalize backdrop-blur-sm border border-white/60
                          ${catStyle.bg} ${catStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${catStyle.dot}`} />
          {facility.category}
        </span>

        {/* Capacity badge */}
        {facility.max_capacity && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-medium
                           px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
            <Users className="w-3 h-3" />
            {facility.max_capacity}
          </span>
        )}
      </Link>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1.5
                         group-hover:text-blue-700 transition-colors leading-snug">
            <Link href={detailUrl}>{facility.name}</Link>
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {facility.short_description ?? facility.description ?? "Premium facility available for booking."}
          </p>
        </div>

        {/* ── Price row + CTAs ── */}
        <div className="mt-4 pt-4 border-t border-slate-100">

          <div className="flex items-center gap-2">
            {/* Primary CTA — full weight */}
            <Link
              href={bookUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold
                         text-white py-2.5 px-4 rounded-lg
                         shadow-sm hover:shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Book Now
            </Link>

            {/* Secondary — ghost, no visual competition */}
            <Link
              href={detailUrl}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500
                         hover:text-blue-700 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-all"
            >
              Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom accent bar — grows on hover */}
      <div
        className="h-0.5 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        style={{ background: "linear-gradient(90deg, #07377a, #5C6795)" }}
      />
    </motion.article>
  );
}
