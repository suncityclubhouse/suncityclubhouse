"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/formatters";
import type { Facility, FacilityPackage } from "@/types/database";
import { motion } from "framer-motion";

interface FacilityCardProps {
  facility: Facility & {
    facility_packages?: Pick<FacilityPackage, "price" | "type">[];
  };
  index?: number;
}

const smoothEase = [0.16, 1, 0.3, 1] as const;

export function FacilityCard({ facility, index = 0 }: FacilityCardProps) {
  const detailUrl = `/facilities/${facility.slug}`;
  const bookUrl = `/facilities/${facility.slug}/book`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: smoothEase, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        {facility.thumbnail_url ? (
          <Image
            src={facility.thumbnail_url}
            alt={facility.name}
            fill
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <span className="text-slate-300 text-4xl font-serif">
              {facility.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Category tag */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-600 px-2.5 py-1 rounded-full capitalize">
          {facility.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
          {facility.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {facility.short_description ?? facility.description ?? "Premium facility available for booking."}
        </p>

        <div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 text-white font-semibold gap-1 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
            >
              <Link href={bookUrl}>
                <CalendarCheck className="w-3.5 h-3.5" />
                Book Now
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 border-slate-300 hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all gap-1 rounded-lg"
            >
              <Link href={detailUrl}>
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
