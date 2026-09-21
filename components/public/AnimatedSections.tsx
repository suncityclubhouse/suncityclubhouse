"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
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
              style={{ color: "#08428C" }}
            >
              Our Spaces
            </p>
            <h2 className="font-serif text-4xl font-semibold text-slate-900 mb-4">
              Premium Facilities
            </h2>
            <div className="divider-blue w-24 mx-auto mb-4" />
            <p className="text-slate-500 max-w-xl mx-auto">
              Every facility is professionally maintained and available for booking online.
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
              style={{ color: "#08428C" }}
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
                  style={{ background: "linear-gradient(90deg, transparent, #08428C, transparent)" }}
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
          <FadeIn animation="fade-up" className="mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#08428C" }}>
              Simple Process
            </p>
            <h2 className="font-serif text-3xl font-semibold text-slate-900">How to Book</h2>
            <div className="divider-blue w-16 mt-3" />
          </FadeIn>

          {/* Steps — relative so the connector line can sit between them */}
          <div className="relative">
            {/* Horizontal connector — desktop only */}
            <div
              className="hidden md:block absolute top-7 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px"
              style={{ background: "linear-gradient(90deg, #cbd5e1, #08428C44, #cbd5e1)" }}
            />

            <StaggerContainer stagger={0.16} delay={0.05} className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
              {[
                {
                  num: "01",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  ),
                  title: "Pick a Facility",
                  desc: "Browse our spaces — banquet hall, sports courts, guest rooms, and more. Each listing shows capacity and pricing.",
                },
                {
                  num: "02",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  title: "Choose Date & Slot",
                  desc: "Select your date, package, and time slot from real-time availability. Residents get their own rate automatically.",
                },
                {
                  num: "03",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  ),
                  title: "Pay & Get Confirmed",
                  desc: "Scan the UPI QR, upload your payment screenshot with the UTR number. Our team verifies and confirms within a few hours.",
                },
              ].map(({ num, icon, title, desc }) => (
                <StaggerItem key={num} animation="fade-up">
                  <div className="flex flex-col items-start md:items-center text-left md:text-center">
                    {/* Step number circle */}
                    <div className="relative mb-5">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: "#08428C20", background: "#f0f5ff" }}
                      >
                        <span style={{ color: "#08428C" }}>{icon}</span>
                      </div>
                      {/* Step number badge */}
                      <span
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none"
                        style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
                      >
                        {num}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs md:max-w-none">{desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
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
                style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
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
