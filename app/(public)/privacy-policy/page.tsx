import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { Footer } from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Suncity Clubhouse",
  description:
    "Read the Privacy Policy for Suncity Clubhouse by Mahavir Group. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-2">
          <Link href="/" className="hover:text-stone-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-700 font-medium">Privacy Policy</span>
        </nav>
      </div>

      {/* Hero banner */}
      <section
        className="py-14 md:py-20 text-center"
        style={{
          background:
            "linear-gradient(135deg, #fdf8ed 0%, #f5f0e1 50%, #fdf8ed 100%)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#f9edcc" }}
        >
          <Shield className="w-8 h-8" style={{ color: "#8b6914" }} />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">
          Privacy{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #d4a82e, #8b6914)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Policy
          </span>
        </h1>
        <p className="text-stone-500 max-w-xl mx-auto text-base md:text-lg">
          Your trust is important to us. Learn how we handle your data.
        </p>
        <div className="divider-blue w-24 mx-auto mt-6" />
      </section>

      {/* Policy content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-stone max-w-none space-y-5 text-stone-600 leading-relaxed">
            <p className="text-sm text-stone-400 italic">
              Last updated: June 1, 2026
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              1. Information We Collect
            </h2>
            <p>
              When you make a booking at Suncity Clubhouse, we may collect the
              following information:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>
                Full name and contact number of the person making the booking.
              </li>
              <li>
                Flat or house number within the Suncity township for
                verification purposes.
              </li>
              <li>
                Date, time, and facility selection details related to your
                booking.
              </li>
              <li>
                Payment transaction screenshots or references uploaded during
                the booking process.
              </li>
            </ul>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              2. How We Use Your Information
            </h2>
            <p>Your information is used exclusively to:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Process and confirm your facility bookings.</li>
              <li>
                Verify payment and communicate booking status via WhatsApp or
                phone.
              </li>
              <li>
                Manage facility availability and prevent scheduling conflicts.
              </li>
              <li>
                Improve our services and user experience on this platform.
              </li>
            </ul>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              3. Data Sharing
            </h2>
            <p>
              We do <strong>not</strong> sell, trade, or share your personal
              information with any third party. Your data is only accessible to
              the Suncity Clubhouse management team and authorized
              administrators of the Mahavir Group.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              4. Data Retention
            </h2>
            <p>
              Booking records and associated personal data are retained for a
              period of 12 months from the date of the booking for
              record-keeping and dispute resolution purposes. After this
              period, data may be anonymized or deleted at our discretion.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              5. Security
            </h2>
            <p>
              We employ industry-standard security measures to protect your
              data. All communications between your browser and our servers are
              encrypted using SSL/TLS. Access to personal data is restricted to
              authorized personnel only.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              6. Your Rights
            </h2>
            <p>
              You have the right to request access to, correction of, or
              deletion of your personal data at any time. To exercise these
              rights, please contact us via the WhatsApp number listed on our
              website or reach out to the clubhouse management office.
            </p>
          </div>

          {/* Contact note */}
          <div
            className="rounded-2xl border p-6 text-center mt-12"
            style={{
              borderColor: "rgba(212,168,46,0.3)",
              backgroundColor: "#fdf8ed",
            }}
          >
            <p className="text-stone-700 font-medium mb-1">
              Have questions about our privacy practices?
            </p>
            <p className="text-sm text-stone-500">
              Reach out to us via the WhatsApp number on our website or visit
              the clubhouse management office during working hours.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
