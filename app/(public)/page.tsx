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
      {facilities.map((facility) => (
        <FacilityCard key={facility.id} facility={facility as any} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Parallax Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg_img.jpg')" }}
        />
        {/* Dark overlay for text readability and premium feel */}
        <div className="absolute inset-0 z-0 bg-black/30 bg-gradient-to-t from-stone-900/60 via-black/20 to-black/40" />

        {/* Decorative rings */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-white/10 animate-pulse" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full border border-amber-600/20" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 text-xs font-medium px-4 py-1.5 rounded-full mb-6 animate-fade-in">
            <Star className="w-3 h-3 fill-amber-300" />
            A Mahavir Group Development — Experience. Quality. Trust.
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
            Suncity{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #d4a82e, #f9edcc, #d4a82e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Clubhouse
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book premium facilities for your events, sports, and celebrations.
            Seamless online booking — no registration required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-amber-900/30 hover:scale-[1.02] transition-all"
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
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-xl bg-transparent transition-all"
            >
              <Link href="#about">Learn More</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-12 sm:mt-16 text-center">
            {[
              { num: "25+", label: "Years of Excellence" },
              { num: "500+", label: "Events Hosted" },
              { num: "100%", label: "Secure Booking" },
            ].map((s) => (
              <div key={s.label} className="group">
                <p className="text-3xl font-bold text-white group-hover:text-amber-300 transition-colors">{s.num}</p>
                <p className="text-sm text-stone-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
      </section>

      {/* ─── ABOUT / MAHAVIR GROUP ─── video bg, no stat cards ── */}
      <section id="about" className="relative overflow-hidden scroll-animate" style={{ minHeight: "580px" }}>

        {/* Looping background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/bg-vid.mp4" type="video/mp4" />
        </video>

        {/* Minimal transition overlay for maximum video visibility with seamless edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.05) 6%, rgba(255,255,255,0) 15%, rgba(255,255,255,0) 85%, rgba(255,255,255,0.05) 94%, rgba(250,250,249,0.85) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-20 md:py-28 text-center">

          {/* Section label */}
          <p className="text-xs font-bold uppercase tracking-widest mb-4 drop-shadow-[0_1.5px_3px_rgba(255,255,255,0.9)]" style={{ color: "#b45309" }}>
            About Us
          </p>

          {/* Heading */}
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 mb-6 leading-tight drop-shadow-[0_2px_6px_rgba(255,255,255,0.95)]">
            A Legacy of{" "}
            <span className="font-bold relative inline-block">
              Excellence
              <span
                className="absolute -bottom-1 left-0 w-full h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, #d4a82e, transparent)" }}
              />
            </span>
          </h2>

          {/* Body copy */}
          <p className="text-stone-900 text-base sm:text-lg font-semibold leading-relaxed mb-5 max-w-2xl mx-auto drop-shadow-[0_1.5px_4px_rgba(255,255,255,0.95)]">
            Suncity Clubhouse is the crown jewel of Suncity — a premium township developed by{" "}
            <a
              href="https://mahavirgroupindia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-amber-900 hover:text-amber-700 transition-colors underline-offset-2 hover:underline"
            >
              Mahavir Group
            </a>
            , Chhattisgarh&apos;s most trusted real estate developer with over 25 years of building
            landmarks that define modern living.
          </p>

          <p className="text-stone-800 text-sm sm:text-base font-semibold leading-relaxed mb-10 max-w-xl mx-auto drop-shadow-[0_1.5px_4px_rgba(255,255,255,0.95)]">
            Our clubhouse offers world-class recreational and event facilities for residents and their guests —
            professionally managed, beautifully maintained, and available to book in minutes from your phone.
          </p>

          {/* Mahavir Group logo — centred and prominent */}
          <div
            className="flex justify-center"
          >
            <div
              className="inline-flex items-center justify-center px-8 py-5 rounded-2xl border shadow-lg backdrop-blur-md"
              style={{ borderColor: "rgba(212,168,46,0.35)", backgroundColor: "rgba(253,248,237,0.92)" }}
            >
              <Image
                src="/mahavir-logo.png"
                alt="Mahavir Group"
                width={220}
                height={80}
                className="w-auto object-contain"
                style={{ maxHeight: "70px" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FACILITIES GRID ──────────────────────────────────── */}
      <section id="facilities" className="py-16 md:py-24 bg-stone-50 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#d97706" }}
            >
              Our Spaces
            </p>
            <h2 className="font-serif text-4xl font-semibold text-stone-900 mb-4">
              Premium Facilities
            </h2>
            <div className="divider-gold w-24 mx-auto mb-4" />
            <p className="text-stone-500 max-w-xl mx-auto">
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

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 bg-white scroll-animate">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#d97706" }}>
              Simple Process
            </p>
            <h2 className="font-serif text-3xl font-semibold text-stone-900">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Clock, title: "Choose a Facility", desc: "Browse our premium facilities and select the one that fits your event." },
              { step: "02", icon: Star, title: "Pick Your Date & Slot", desc: "Select your preferred date and time slot from real-time availability." },
              { step: "03", icon: Shield, title: "Pay & Confirm", desc: "Upload your UPI payment proof. Our team reviews and confirms within hours." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center group">
                <div className="relative inline-block mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: "#f9edcc" }}
                  >
                    <Icon className="w-7 h-7" style={{ color: "#8b6914" }} />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg, #8b6914, #d4a82e)" }}
                  >
                    {step}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────── */}
      <section
        id="contact"
        className="py-24 relative overflow-hidden scroll-animate"
        style={{ backgroundColor: "#1a2f3d" }}
      >
        {/* Decorative gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(212,168,46,0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(49,74,89,0.3) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: "rgba(212,168,46,0.15)", color: "#d4a82e", border: "1px solid rgba(212,168,46,0.2)" }}
          >
            <Star className="w-3 h-3 fill-current" />
            Ready to Book?
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Your Perfect Venue{" "}
            <span style={{ color: "#d4a82e" }}>Awaits</span>
          </h2>
          <p className="text-stone-400 mb-10 text-lg max-w-xl mx-auto leading-relaxed">
            Book any facility at Suncity Clubhouse in under 3 minutes.
            No account needed. Available 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-white font-semibold px-10 py-6 text-base rounded-xl shadow-lg hover:shadow-amber-900/30 hover:scale-[1.02] transition-all"
              style={{ background: "linear-gradient(135deg, #8b6914, #d4a82e)" }}
            >
              <Link href="#facilities">
                Book Now — Free to Browse
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          {/* Mahavir Group credit */}
          <div className="mt-12 flex items-center justify-center gap-3 opacity-40">
            <div className="h-px w-12 bg-white/30" />
            <Image
              src="/mahavir-logo.png"
              alt="Mahavir Group"
              width={80}
              height={24}
              className="h-5 w-auto object-contain brightness-0 invert"
            />
            <div className="h-px w-12 bg-white/30" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
