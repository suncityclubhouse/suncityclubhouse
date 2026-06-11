import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, RefreshCcw } from "lucide-react";
import { Footer } from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Suncity Clubhouse",
  description:
    "Read the Refund and Cancellation Policy for Suncity Clubhouse by Mahavir Group. Understand our booking cancellation terms and refund process.",
};

export default function RefundPolicyPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-2">
          <Link href="/" className="hover:text-stone-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-700 font-medium">
            Refund &amp; Cancellation Policy
          </span>
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
          <RefreshCcw className="w-8 h-8" style={{ color: "#8b6914" }} />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">
          Refund &amp; Cancellation{" "}
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
          Understand our cancellation terms and refund process.
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
              1. Booking Confirmation
            </h2>
            <p>
              All bookings are considered confirmed only after the uploaded
              payment proof (UPI screenshot or transaction reference) has been
              verified by the clubhouse management team. You will receive a
              confirmation notification via WhatsApp once your booking is
              approved.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              2. Cancellation by the User
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>More than 48 hours before the event:</strong> Full
                refund of the booking amount (minus any applicable processing
                fees).
              </li>
              <li>
                <strong>24–48 hours before the event:</strong> 50% refund of
                the booking amount.
              </li>
              <li>
                <strong>Less than 24 hours before the event:</strong> No refund
                will be issued.
              </li>
            </ul>
            <p className="text-sm">
              To cancel a booking, please contact the clubhouse management via
              WhatsApp or visit the management office in person.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              3. Cancellation by Management
            </h2>
            <p>
              In rare circumstances (such as maintenance, natural events, or
              emergencies), the clubhouse management reserves the right to
              cancel a confirmed booking. In such cases, a{" "}
              <strong>full refund</strong> will be issued, and you will be
              notified as early as possible.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              4. Refund Processing
            </h2>
            <p>
              Approved refunds will be processed within{" "}
              <strong>7–10 business days</strong> from the date of cancellation
              approval. Refunds will be credited to the same payment method
              used for the original booking (UPI, bank transfer, etc.).
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              5. Rescheduling
            </h2>
            <p>
              Rescheduling is permitted free of charge if requested more than
              48 hours before the original booking date, subject to
              availability. Rescheduling requests within 48 hours of the event
              will be treated as a cancellation and a new booking.
            </p>

            <h2 className="font-serif text-xl font-semibold text-stone-800 !mt-8">
              6. Disputes
            </h2>
            <p>
              For any disputes regarding bookings, payments, or refunds, please
              contact the Suncity Clubhouse management team. All disputes will
              be resolved in accordance with the laws of India, with
              jurisdiction in the courts of Raipur, Chhattisgarh.
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
              Need help with a cancellation or refund?
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
