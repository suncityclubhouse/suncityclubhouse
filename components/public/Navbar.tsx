"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/lib/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

const smoothEase = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function scrollToFacilities(e: React.MouseEvent) {
    e.preventDefault();
    const el = document.getElementById("facilities");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    } else {
      window.location.href = "/#facilities";
    }
    setOpen(false);
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: smoothEase }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/97 backdrop-blur-md shadow-md border-b border-slate-100"
          : "bg-white/85 backdrop-blur-sm border-b border-slate-100/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">

          {/* LEFT — Desktop nav / Mobile hamburger */}
          <div className="flex items-center">
          <nav className="hidden lg:flex items-center gap-6">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
            >
              <Home className="w-3.5 h-3.5" />
              Home
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            {["facilities", "about", "contact"].map((id) => (
              <a
                key={id}
                href={`/#${id}`}
                onClick={(e) => {
                  const el = document.getElementById(id);
                  if (el) {
                    e.preventDefault();
                    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
                  }
                }}
                className="capitalize text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group cursor-pointer"
              >
                {id === "contact" ? "Contact" : id.charAt(0).toUpperCase() + id.slice(1)}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
            <button
              className="lg:hidden p-2 -ml-1 rounded-md text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* CENTRE — Mahavir Group logo */}
          <div className="flex justify-center">
            <Link
              href="https://mahavirgroupindia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center opacity-90 hover:opacity-100 transition-opacity"
              title="Mahavir Group — Developer of Suncity"
            >
              <Image
                src="/mahavir-logo.png"
                alt="Mahavir Group"
                width={130}
                height={40}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* RIGHT — CTA */}
          <div className="flex items-center justify-end gap-3">
            {WHATSAPP && (
              <a
                href={getWhatsAppUrl(WHATSAPP, "Hi, I'd like to enquire about a facility booking at Suncity Clubhouse.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
            <Button
              asChild
              size="sm"
              className="text-white font-semibold shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
            >
              <a href="/#facilities" onClick={scrollToFacilities}>Book Now</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet drawer — Framer Motion animated */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="lg:hidden overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-white px-4 py-4 space-y-1">
              {[
                { id: "home", label: "Home", href: "/", isLink: true },
                { id: "facilities", label: "Facilities" },
                { id: "about", label: "About" },
                { id: "contact", label: "Contact" },
              ].map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 + i * 0.06, ease: smoothEase }}
                >
                  {item.isLink ? (
                    <Link
                      href={item.href!}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 py-2.5 border-b border-slate-50 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={`/#${item.id}`}
                      onClick={(e) => {
                        const el = document.getElementById(item.id);
                        if (el) {
                          e.preventDefault();
                          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
                        }
                        setOpen(false);
                      }}
                      className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-2.5 border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </a>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3, ease: smoothEase }}
                className="pt-2"
              >
                <Button
                  asChild
                  className="w-full text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
                >
                  <Link href="/#facilities" onClick={() => setOpen(false)}>
                    Book a Facility
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
