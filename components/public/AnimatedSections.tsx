"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion";

interface AnimatedSectionsProps {
  children: ReactNode; /* The <FacilitiesGrid /> Suspense block is passed here */
}

export function AnimatedSections({ children }: AnimatedSectionsProps) {
  return (
    <>
      {/* ─── FACILITIES GRID ──────────────────────────────────── */}
      <section id="facilities" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn animation="fade-up" className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#2563eb" }}
            >
              Our Spaces
            </p>
            <h2 className="font-serif text-4xl font-semibold text-slate-900 mb-4">
              Premium Facilities
            </h2>
            <div className="divider-blue w-24 mx-auto mb-4" />
            <p className="text-slate-500 max-w-xl mx-auto">
              Every facility is professionally maintained and available for booking online.
              No registration required — just select, book, and pay.
            </p>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.2}>
            {children}
          </FadeIn>
        </div>
      </section>

      {/* ─── ABOUT / MAHAVIR GROUP ─── video bg, no stat cards ── */}
      <section id="about" className="relative overflow-hidden" style={{ minHeight: "580px" }}>
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

        {/* Minimal transition overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.05) 6%, rgba(255,255,255,0) 15%, rgba(255,255,255,0) 85%, rgba(255,255,255,0.05) 94%, rgba(248,250,252,0.85) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 lg:px-8 py-20 md:py-28 text-center">
          <FadeIn animation="fade-up-small" delay={0.1}>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4 drop-shadow-[0_1.5px_3px_rgba(255,255,255,0.9)]"
              style={{ color: "#1d4ed8" }}
            >
              About Us
            </p>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.2}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight drop-shadow-[0_2px_6px_rgba(255,255,255,0.95)]">
              A Legacy of{" "}
              <span className="font-bold relative inline-block">
                Excellence
                <span
                  className="absolute -bottom-1 left-0 w-full h-0.5"
                  style={{ background: "linear-gradient(90deg, transparent, #3b82f6, transparent)" }}
                />
              </span>
            </h2>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.3}>
            <p className="text-slate-900 text-base sm:text-lg font-semibold leading-relaxed mb-5 max-w-2xl mx-auto drop-shadow-[0_1.5px_4px_rgba(255,255,255,0.95)]">
              Suncity Clubhouse is the crown jewel of Suncity — a premium township developed by{" "}
              <a
                href="https://mahavirgroupindia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-700 hover:text-blue-500 transition-colors underline-offset-2 hover:underline"
              >
                Mahavir Group
              </a>
              , Chhattisgarh&apos;s most trusted real estate developer with over 25 years of building
              landmarks that define modern living.
            </p>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.4}>
            <p className="text-slate-800 text-sm sm:text-base font-semibold leading-relaxed mb-10 max-w-xl mx-auto drop-shadow-[0_1.5px_4px_rgba(255,255,255,0.95)]">
              Our clubhouse offers world-class recreational and event facilities for residents and their guests —
              professionally managed, beautifully maintained, and available to book in minutes from your phone.
            </p>
          </FadeIn>

          {/* Mahavir Group logo */}
          <FadeIn animation="scale-in" delay={0.5}>
            <div className="flex justify-center">
              <div
                className="inline-flex items-center justify-center px-8 py-5 rounded-2xl border shadow-lg backdrop-blur-md"
                style={{ borderColor: "rgba(59,130,246,0.35)", backgroundColor: "rgba(239,246,255,0.92)" }}
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
          </FadeIn>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn animation="fade-up" className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#2563eb" }}>
              Simple Process
            </p>
            <h2 className="font-serif text-3xl font-semibold text-slate-900">How It Works</h2>
          </FadeIn>

          <StaggerContainer stagger={0.18} delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Clock, title: "Choose a Facility", desc: "Browse our premium facilities and select the one that fits your event." },
              { step: "02", icon: Star, title: "Pick Your Date & Slot", desc: "Select your preferred date and time slot from real-time availability." },
              { step: "03", icon: Shield, title: "Pay & Confirm", desc: "Upload your UPI payment proof. Our team reviews and confirms within hours." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <StaggerItem key={step} animation="fade-up" className="text-center group">
                <div className="relative inline-block mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: "#dbeafe" }}
                  >
                    <Icon className="w-7 h-7" style={{ color: "#1d4ed8" }} />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
                  >
                    {step}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────── */}
      <section
        id="contact"
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: "#0f172a" }}
      >
        {/* Decorative gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(29,78,216,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn animation="scale-in">
            <div
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <Star className="w-3 h-3 fill-current" />
              Ready to Book?
            </div>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.15}>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Your Perfect Venue{" "}
              <span style={{ color: "#60a5fa" }}>Awaits</span>
            </h2>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.25}>
            <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto leading-relaxed">
              Book any facility at Suncity Clubhouse in under 3 minutes.
              No account needed. Available 24/7.
            </p>
          </FadeIn>

          <FadeIn animation="fade-up" delay={0.35}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="text-white font-semibold px-10 py-6 text-base rounded-xl shadow-lg hover:shadow-blue-900/30 hover:scale-[1.02] transition-all"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
              >
                <Link href="#facilities">
                  Book Now — Free to Browse
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          {/* Mahavir Group credit */}
          <FadeIn animation="fade" delay={0.5}>
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
          </FadeIn>
        </div>
      </section>
    </>
  );
}
