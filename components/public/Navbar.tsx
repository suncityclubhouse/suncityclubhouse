"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/lib/utils/formatters";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/#facilities", label: "Facilities" },
    { href: "/#about", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-serif font-semibold text-gold-700" style={{ color: "#8b6914" }}>
              Clubhouse
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {WHATSAPP && (
              <a
                href={getWhatsAppUrl(WHATSAPP, "Hi, I'd like to enquire about a booking.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Contact
              </a>
            )}
            <Button asChild size="sm" style={{ backgroundColor: "#8b6914" }} className="hover:opacity-90 text-white">
              <Link href="/#facilities">Book Now</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md text-stone-600 hover:text-stone-900"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 space-y-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-stone-700 hover:text-stone-900 py-1"
            >
              {l.label}
            </Link>
          ))}
          <Button asChild className="w-full" style={{ backgroundColor: "#8b6914" }}>
            <Link href="/#facilities" onClick={() => setOpen(false)}>
              Book a Facility
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
