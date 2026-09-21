"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const E = [0.16, 1, 0.3, 1] as const;

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

// Facility names scroll marquee — hardcoded since these are fixed assets
const MARQUEE_ITEMS = [
  "Banquet Hall",
  "Badminton Court",
  "Swimming Pool",
  "Squash Court",
  "Guest Rooms",
  "Lawn Area",
  "Conference Room",
  "Gymnasium",
];

export function HeroSection() {
  return (
    <section className="relative min-h-[82vh] flex flex-col overflow-hidden">

      {/* ── Background ── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg_img.jpg')" }}
      />

      {/* Directional overlay — heavier at bottom-left where text sits */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(7,28,60,0.82) 0%, rgba(7,28,60,0.55) 45%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Subtle noise grain — makes it feel photographed not rendered */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── Main content — left-aligned on desktop ── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-20">

          {/* Location pill — small, factual, top */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: E, delay: 0.15 }}
            className="inline-flex items-center gap-2 mb-5"
          >
            <span className="w-px h-4 bg-white/30" />
            <MapPin className="w-3.5 h-3.5 text-white/50" />
            <span className="text-xs text-white/60 font-medium tracking-widest uppercase">
              Mahavir Suncity, Rajnandgaon
            </span>
          </motion.div>

          {/* Headline — editorial, broken intentionally */}
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: E, delay: 0.3 }}
              className="font-serif leading-[1.08] text-white"
              style={{ fontSize: "clamp(2.6rem, 6vw, 5.5rem)", fontWeight: 700 }}
            >
              {/* Line 1 — light weight */}
              <span className="block font-light text-white/75" style={{ fontSize: "0.55em", letterSpacing: "0.04em", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                Book your
              </span>
              {/* Line 2 — heavy serif */}
              <span className="block">Perfect Space</span>
              {/* Line 3 — brand accent, thinner */}
              <span className="block font-normal" style={{ color: "#afc3e2" }}>
                at Suncity.
              </span>
            </motion.h1>

            {/* Dividing rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: E, delay: 0.65 }}
              className="origin-left h-px w-24 bg-white/25 my-5"
            />

            {/* Subtext — concise, specific */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: E, delay: 0.75 }}
              className="text-white/65 leading-relaxed max-w-md"
              style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)" }}
            >
              Banquet halls, sports courts, guest rooms, and more —<br className="hidden sm:block" />
              all available to book in minutes. No login required.
            </motion.p>
          </div>

          {/* CTA block — single strong button + secondary text link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: E, delay: 0.95 }}
            className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          >
            <Link
              href="#facilities"
              className="group inline-flex items-center gap-3 text-white font-semibold
                         text-base px-7 py-4 rounded-xl
                         shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.45)]
                         hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #07377a 0%, #08428C 60%, #1a4fa0 100%)" }}
            >
              See All Facilities
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {WHATSAPP && (
              <a
                href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20a%20facility%20booking.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90
                           font-medium transition-colors group"
              >
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="group-hover:underline underline-offset-2">Chat on WhatsApp</span>
              </a>
            )}
          </motion.div>

          {/* Stats row — understated, horizontal, left-aligned */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: E, delay: 1.3 }}
            className="mt-10 flex items-center gap-8 sm:gap-12"
          >
            {[
              { num: "25+", label: "Years of Trust" },
              { num: "6+", label: "Facilities" },
              { num: "24/7", label: "Online Booking" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E, delay: 1.4 + i * 0.1 }}
                className="text-left"
              >
                <p className="text-2xl sm:text-3xl font-bold text-white font-serif leading-none">
                  {s.num}
                </p>
                <p className="text-[11px] text-white/45 mt-1.5 font-medium uppercase tracking-wider">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Scrolling marquee strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: E, delay: 1.5 }}
        className="relative z-10 overflow-hidden"
      >
        {/* Top decorative border — two-line with glow */}
        <div className="relative h-px w-full">
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(175,195,226,0.25) 20%, rgba(8,66,140,0.6) 50%, rgba(175,195,226,0.25) 80%, transparent 100%)" }} />
        </div>
        <div className="relative h-px w-full mt-px">
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)" }} />
        </div>

        {/* Strip body */}
        <div
          className="py-3.5"
          style={{ background: "linear-gradient(180deg, rgba(7,28,60,0.75) 0%, rgba(4,18,40,0.85) 100%)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex whitespace-nowrap" style={{ animation: "marquee 28s linear infinite" }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((name, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-7 text-[11px] font-semibold text-white/80 uppercase tracking-[0.22em]">
                {/* Diamond separator */}
                <svg width="6" height="6" viewBox="0 0 6 6" className="flex-shrink-0 opacity-50">
                  <rect x="1" y="1" width="4" height="4" rx="0.5" transform="rotate(45 3 3)" fill="#afc3e2" />
                </svg>
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom decorative border */}
        <div className="relative h-px w-full">
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(8,66,140,0.5) 40%, rgba(175,195,226,0.3) 60%, transparent 100%)" }} />
        </div>
      </motion.div>



      {/* Bottom fade to white */}
      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-50 to-transparent z-10" />
    </section>
  );
}
