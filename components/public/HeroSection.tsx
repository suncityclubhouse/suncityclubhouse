"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FloatingElement } from "./motion";

const smoothEase = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Parallax Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg_img.jpg')" }}
      />
      {/* Dark overlay for text readability and premium feel */}
      <div className="absolute inset-0 z-0 bg-black/30 bg-gradient-to-t from-slate-900/60 via-black/20 to-black/40" />

      {/* Decorative floating rings */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <FloatingElement y={18} duration={6} delay={0}>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-white/10" />
        </FloatingElement>
        <FloatingElement y={12} duration={5} delay={1}>
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full border border-white/10" />
        </FloatingElement>
        <FloatingElement y={15} duration={7} delay={0.5}>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full border border-brand-400/20" />
        </FloatingElement>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Tag */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: smoothEase, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-xs font-medium px-4 py-1.5 rounded-full mb-6"
        >
          <Star className="w-3 h-3 fill-current text-blue-200" />
          A Mahavir Group Development — Experience. Quality. Trust.
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: smoothEase, delay: 0.4 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4"
        >
          Suncity{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #5C6795, #afc3e2, #5C6795)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Clubhouse
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: smoothEase, delay: 0.6 }}
          className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Book premium facilities for your events, sports, and celebrations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: smoothEase, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            asChild
            size="lg"
            className="text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-brand-900/30 hover:scale-[1.02] transition-all"
            style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
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
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: smoothEase, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-12 sm:mt-16 text-center"
        >
          {[
            { num: "25+", label: "Years of Excellence" },
            { num: "500+", label: "Events Hosted" },
            { num: "100%", label: "Secure Booking" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: smoothEase, delay: 1.2 + i * 0.15 }}
              className="group"
            >
              <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
                {s.num}
              </p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
    </section>
  );
}
