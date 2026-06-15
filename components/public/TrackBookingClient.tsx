"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, CheckCircle2, Clock, XCircle, Ban, AlertCircle, CalendarDays, Building2, IndianRupee, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBookingByRef } from "@/actions/bookings";
import { formatINR } from "@/lib/utils/formatters";
import type { BookingWithFacility } from "@/types/database";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Clock className="w-5 h-5 text-amber-600" />,
  },
  pending_approval: {
    label: "Pending Approval",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Clock className="w-5 h-5 text-blue-600" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: <Ban className="w-5 h-5 text-slate-500" />,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  },
  expired: {
    label: "Expired",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: <AlertCircle className="w-5 h-5 text-slate-400" />,
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TrackBookingClient() {
  const searchParams = useSearchParams();
  const [ref, setRef] = useState(searchParams.get("ref") ?? "");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingWithFacility | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-search if ?ref= is in the URL (coming from confirmation page)
  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (refFromUrl && refFromUrl.length >= 4) {
      handleSearchWithRef(refFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchWithRef = async (refVal: string) => {
    setLoading(true);
    setError(null);
    setBooking(null);
    const result = await getBookingByRef(refVal.trim().toUpperCase());
    setLoading(false);
    if (!result.success || !result.data) {
      setError("No booking found with that reference. Please double-check the code.");
      return;
    }
    setBooking(result.data as unknown as BookingWithFacility);
  };

  const handleSearch = () => handleSearchWithRef(ref);

  const status = booking ? STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.awaiting_payment : null;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <label htmlFor="booking-ref" className="block text-sm font-semibold text-stone-700">
          Booking Reference Code
        </label>
        <div className="flex gap-3">
          <Input
            id="booking-ref"
            value={ref}
            onChange={(e) => {
              setRef(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. X9K2P4"
            maxLength={12}
            className="text-center tracking-[0.25em] text-lg font-mono font-bold uppercase"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !ref.trim()}
            style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
            className="text-white hover:opacity-90 disabled:opacity-40 px-5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Result Card */}
      {booking && status && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {/* Status banner */}
          <div className={`flex items-center gap-3 px-6 py-4 ${status.bg} border-b ${status.border}`}>
            {status.icon}
            <div>
              <p className={`font-semibold text-sm ${status.color}`}>{status.label}</p>
              {booking.status === "pending_approval" && (
                <p className="text-xs text-blue-600 mt-0.5">Payment received — our team is reviewing your booking (usually 2–4 hrs).</p>
              )}
              {booking.status === "confirmed" && (
                <p className="text-xs text-emerald-600 mt-0.5">Your booking is confirmed. See you there!</p>
              )}
              {booking.status === "awaiting_payment" && (
                <p className="text-xs text-amber-600 mt-0.5">Please upload your payment proof to proceed.</p>
              )}
              {booking.status === "rejected" && booking.rejection_reason && (
                <p className="text-xs text-red-600 mt-0.5">Reason: {booking.rejection_reason}</p>
              )}
            </div>
          </div>

          {/* Booking details */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Facility</p>
                  <p className="text-sm font-semibold text-stone-800">{(booking as any).facility?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Booking Date</p>
                  <p className="text-sm font-semibold text-stone-800">{formatDate(booking.booking_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IndianRupee className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Total Amount</p>
                  <p className="text-sm font-semibold text-stone-800">{formatINR(booking.total_amount)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Reference</p>
                  <p className="text-sm font-bold font-mono text-stone-800 tracking-widest">{booking.booking_ref}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400">
                Booked by <span className="text-stone-600 font-medium">{booking.customer_name}</span>
                {booking.house_number && <> · Flat <span className="text-stone-600 font-medium">{booking.house_number}</span></>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
