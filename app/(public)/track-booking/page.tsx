import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TrackBookingClient } from "@/components/public/TrackBookingClient";

export const metadata: Metadata = {
  title: "Track Your Booking | Suncity Clubhouse",
  description: "Enter your booking reference code to check the status of your facility booking.",
};

export default function TrackBookingPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-8">
        <Link href="/" className="hover:text-stone-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-stone-700 font-medium">Track Booking</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Track Your Booking</h1>
        <p className="text-stone-500 text-sm">Enter the 6-character reference code from your booking confirmation</p>
      </div>

      <TrackBookingClient />
    </div>
  );
}
