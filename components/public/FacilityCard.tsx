"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/formatters";
import type { Facility, FacilityPackage } from "@/types/database";

interface FacilityCardProps {
  facility: Facility & {
    facility_packages?: Pick<FacilityPackage, "price" | "type">[];
  };
}

function getLowestPrice(packages?: Pick<FacilityPackage, "price" | "type">[]): number | null {
  if (!packages || packages.length === 0) return null;
  return Math.min(...packages.map((p) => p.price));
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const startingPrice = getLowestPrice(facility.facility_packages);
  const detailUrl = `/facilities/${facility.slug}`;
  const bookUrl = `/facilities/${facility.slug}/book`;

  return (
    <article className="group rounded-2xl overflow-hidden border border-stone-200 bg-white card-hover shadow-sm">
      {/* Thumbnail */}
      <div className="relative h-52 overflow-hidden bg-stone-100">
        {facility.thumbnail_url ? (
          <Image
            src={facility.thumbnail_url}
            alt={facility.name}
            fill
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <span className="text-stone-300 text-4xl font-serif">
              {facility.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Category tag */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-600 px-2.5 py-1 rounded-full capitalize">
          {facility.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1 group-hover:text-amber-800 transition-colors">
          {facility.name}
        </h3>
        <p className="text-sm text-stone-500 line-clamp-2 mb-4 leading-relaxed">
          {facility.short_description ?? facility.description ?? "Premium facility available for booking."}
        </p>

        <div>
          <div className="mb-3">
            {startingPrice ? (
              <p className="text-sm text-stone-500">
                Starting at{" "}
                <span className="text-base font-semibold text-stone-900">
                  {formatINR(startingPrice)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-stone-400 italic">Pricing on request</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 text-white font-semibold gap-1 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
              style={{ background: "linear-gradient(135deg, #8b6914, #d4a82e)" }}
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
              className="flex-1 border-stone-300 hover:border-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-all gap-1 rounded-lg"
            >
              <Link href={detailUrl}>
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
