import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Star, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilityCard } from "@/components/public/FacilityCard";
import { FacilityCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { getFacilities } from "@/actions/facilities";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Clubhouse — Premium Facility Booking",
  description:
    "Book banquet halls, sports courts, guest rooms, swimming pool, and more at our premium clubhouse. Instant online booking.",
};

const FEATURES = [
  {
    icon: Clock,
    title: "Instant Booking",
    desc: "Book any facility in minutes with our seamless online flow",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "UPI-based payments with payment proof verification",
  },
  {
    icon: Star,
    title: "Premium Facilities",
    desc: "Well-maintained, professionally managed spaces for every occasion",
  },
];

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
      {facilities.map((facility) => (
        <FacilityCard
          key={facility.id}
          facility={facility as any}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="hero-pattern relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-white/5" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full border border-white/5" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3 h-3 fill-amber-300" />
            Premium Clubhouse Facilities
          </div>

          {/* Headline */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Book Your{" "}
            <span className="text-gold-gradient" style={{
              background: "linear-gradient(135deg, #d4a82e, #f9edcc, #d4a82e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Perfect Venue
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed mb-10">
            From intimate gatherings to grand celebrations — browse, book, and celebrate at our
            world-class clubhouse facilities. No account needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-white font-semibold px-8 py-6 text-base rounded-xl"
              style={{ background: "linear-gradient(135deg, #8b6914, #d4a82e)" }}
            >
              <Link href="#facilities">
                Browse Facilities
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-xl bg-transparent"
            >
              <Link href="#about">Learn More</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-center">
            {[
              { num: "6+", label: "Premium Facilities" },
              { num: "500+", label: "Events Hosted" },
              { num: "100%", label: "Secure Booking" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white">{s.num}</p>
                <p className="text-sm text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── FEATURES ─────────────────────────────────────── */}
      <section id="about" className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#f9edcc" }}>
                  <Icon className="w-6 h-6" style={{ color: "#8b6914" }} />
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FACILITIES GRID ──────────────────────────────── */}
      <section id="facilities" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-widest mb-2" style={{ color: "#8b6914" }}>
              Our Spaces
            </p>
            <h2 className="font-serif text-4xl font-semibold text-stone-900 mb-4">
              Premium Facilities
            </h2>
            <div className="divider-gold w-24 mx-auto" />
            <p className="text-stone-500 max-w-xl mx-auto mt-4">
              Every facility is professionally maintained and available for booking online.
              No registration required — just select, book, and pay.
            </p>
          </div>

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
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────── */}
      <section id="contact" className="py-20 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            Ready to Book?
          </h2>
          <p className="text-stone-400 mb-8 text-lg">
            Choose a facility, pick your date, and complete booking in under 3 minutes.
          </p>
          <Button
            asChild
            size="lg"
            className="text-white font-semibold px-10 py-6 text-base rounded-xl"
            style={{ background: "linear-gradient(135deg, #8b6914, #d4a82e)" }}
          >
            <Link href="#facilities">
              Book Now — It&apos;s Free to Browse
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
