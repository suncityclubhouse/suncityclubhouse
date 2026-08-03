import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminBookingForm } from "@/components/admin/AdminBookingForm";
import { getFacilities } from "@/actions/facilities";
import type { FacilityWithMedia } from "@/types/database";

export const metadata: Metadata = { title: "New Booking | Admin" };

export default async function NewBookingPage() {
  const facilities = (await getFacilities(false)) as unknown as FacilityWithMedia[];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-6">
        <Link href="/dashboard/bookings" className="hover:text-stone-600 transition-colors">
          Bookings
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-stone-700 font-medium">New Manual Booking</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Create Manual Booking</h1>
        <p className="text-sm text-stone-500 mt-1">
          Use this for walk-ins, owner bookings, guest bookings, and cash payments.
        </p>
      </div>

      <AdminBookingForm facilities={facilities} />
    </div>
  );
}
