export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilityCard } from "@/components/public/FacilityCard";
import { FacilityCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { Footer } from "@/components/public/Footer";
import { getFacilities } from "@/actions/facilities";
import { Suspense } from "react";
import { HeroSection } from "@/components/public/HeroSection";
import { AnimatedSections } from "@/components/public/AnimatedSections";

export const metadata: Metadata = {
  title: "Suncity Clubhouse — Premium Facility Booking by Mahavir Group",
  description:
    "Book banquet halls, sports courts, guest rooms, swimming pool, and more at Suncity Clubhouse — a Mahavir Group development. Experience. Quality. Trust.",
};

async function FacilitiesGrid() {
  const facilities = await getFacilities();

  if (facilities.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400">
        <p className="text-lg">No facilities available at the moment.</p>
        <p className="text-sm mt-1">Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {facilities.map((facility, index) => (
        <FacilityCard key={facility.id} facility={facility as any} index={index} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <HeroSection />

      {/* ─── ABOUT / MAHAVIR GROUP ─── video bg ── */}
      <AnimatedSections>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <FacilityCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FacilitiesGrid />
        </Suspense>
      </AnimatedSections>

      <Footer />
    </div>
  );
}
