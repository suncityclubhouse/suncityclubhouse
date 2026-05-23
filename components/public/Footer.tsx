import Link from "next/link";
import { Phone } from "lucide-react";


import { getWhatsAppUrl } from "@/lib/utils/formatters";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-xl text-white mb-3">Clubhouse</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Premium facility bookings for our community. Banquet halls, sports courts,
              guest rooms and more — all in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/#facilities", label: "Our Facilities" },
                { href: "/#about", label: "About Us" },
                { href: "/#contact", label: "Contact" },
                { href: "/dashboard/login", label: "Admin Login" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3">
              {WHATSAPP && (
                <li>
                  <a
                    href={getWhatsAppUrl(WHATSAPP, "Hi, I have a query about the clubhouse.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    +{WHATSAPP}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-stone-500">
            © {year} Clubhouse. All rights reserved.
          </p>
          <p className="text-xs text-stone-600">
            Powered by modern tech. Built with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
