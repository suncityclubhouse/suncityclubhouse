"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  AlertCircle,
  CalendarDays,
  Building2,
  IndianRupee,
  Tag,
  Phone,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { getBookingByRef, cancelBookingByUser } from "@/actions/bookings";
import { calculateCancellationRefund } from "@/lib/cancellation-policy";
import { formatINR } from "@/lib/utils/formatters";
import type { BookingWithFacility } from "@/types/database";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
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

  // Cancellation state
  const [cancelPhone, setCancelPhone] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<{
    refundAmount: number;
    deductionAmount: number;
    deductionPercent: number;
    label: string;
  } | null>(null);

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
    setCancelPhone("");
    setCancelSuccess(null);
    const result = await getBookingByRef(refVal.trim().toUpperCase());
    setLoading(false);
    if (!result.success || !result.data) {
      setError("No booking found with that reference. Please double-check the code.");
      return;
    }
    setBooking(result.data as unknown as BookingWithFacility);
  };

  const handleSearch = () => handleSearchWithRef(ref);

  // Compute refund preview client-side (same logic as server — for display only)
  const refundPreview =
    booking && booking.status === "confirmed"
      ? calculateCancellationRefund(booking.booking_date, Number(booking.total_amount))
      : booking && booking.status === "awaiting_payment"
      ? {
          daysUntilBooking: 0,
          deductionPercent: 0,
          deductionAmount: 0,
          refundAmount: Number(booking.total_amount),
          label: "Full refund — no payment was submitted",
        }
      : null;

  const handleCancelConfirm = async () => {
    if (!booking) return;
    if (!cancelPhone || cancelPhone.length < 10) {
      toast.error("Please enter your 10-digit mobile number.");
      return;
    }
    setCancelLoading(true);
    try {
      const result = await cancelBookingByUser({
        bookingRef: booking.booking_ref,
        phone: cancelPhone,
      });
      if (!result.success) {
        toast.error(result.error ?? "Cancellation failed.");
        return;
      }
      setCancelSuccess(result.data!);
      setCancelOpen(false);
      // Refresh booking data to show cancelled status
      await handleSearchWithRef(booking.booking_ref);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const status = booking ? STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.awaiting_payment : null;

  // User can self-cancel only awaiting_payment and confirmed
  const canUserCancel =
    booking && ["awaiting_payment", "confirmed"].includes(booking.status);

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

      {/* Cancellation success banner */}
      {cancelSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Booking Cancelled Successfully</p>
            <p className="text-sm text-emerald-700 mt-1">{cancelSuccess.label}</p>
            {cancelSuccess.refundAmount > 0 ? (
              <p className="text-sm text-emerald-700 mt-1">
                You will receive a refund of{" "}
                <strong>{formatINR(cancelSuccess.refundAmount)}</strong>.
                {cancelSuccess.deductionAmount > 0 && (
                  <> ({formatINR(cancelSuccess.deductionAmount)} cancellation charge applied)</>
                )}
              </p>
            ) : (
              <p className="text-sm text-red-700 mt-1">
                No refund applicable as per the cancellation policy.
              </p>
            )}
            <p className="text-xs text-emerald-600 mt-2">
              Please contact the clubhouse office to process your refund.
            </p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {booking && status && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {/* Status banner */}
          <div className={`flex items-center gap-3 px-6 py-4 ${status.bg} border-b ${status.border}`}>
            {status.icon}
            <div>
              <p className={`font-semibold text-sm ${status.color}`}>{status.label}</p>
              {booking.status === "pending_approval" && (
                <p className="text-xs text-blue-600 mt-0.5">
                  Payment received — our team is reviewing your booking (usually 2–4 hrs).
                </p>
              )}
              {booking.status === "confirmed" && (
                <p className="text-xs text-emerald-600 mt-0.5">Your booking is confirmed. See you there!</p>
              )}
              {booking.status === "awaiting_payment" && (
                <p className="text-xs text-amber-600 mt-0.5">Please upload your payment proof to proceed.</p>
              )}
              {booking.status === "rejected" && (booking as any).rejection_reason && (
                <p className="text-xs text-red-600 mt-0.5">Reason: {(booking as any).rejection_reason}</p>
              )}
              {booking.status === "cancelled" && (booking as any).cancellation_reason && (
                <p className="text-xs text-slate-500 mt-0.5">{(booking as any).cancellation_reason}</p>
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
                  <p className="text-sm font-bold font-mono text-stone-800 tracking-widest">
                    {booking.booking_ref}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-stone-400">
                Booked by{" "}
                <span className="text-stone-600 font-medium">{booking.customer_name}</span>
                {booking.house_number && (
                  <>
                    {" "}· Flat{" "}
                    <span className="text-stone-600 font-medium">{booking.house_number}</span>
                  </>
                )}
              </p>
              {/* Public invoice download — uses ?ref= for server-side authorization */}
              <a
                href={`/api/invoice/${booking.id}?ref=${encodeURIComponent(booking.booking_ref)}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#07377a] hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Invoice (PDF)
              </a>
            </div>

            {/* ── Cancel section ── */}
            {canUserCancel && (
              <div className="pt-3 border-t border-stone-100">
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-700">Want to cancel this booking?</p>
                  </div>
                  <p className="text-xs text-red-600">
                    Enter the mobile number you used when booking to verify your identity.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                      <Input
                        type="tel"
                        value={cancelPhone}
                        onChange={(e) => setCancelPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="pl-9 text-sm"
                        maxLength={10}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      disabled={cancelPhone.length < 10}
                      onClick={() => setCancelOpen(true)}
                      className="gap-1.5 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel Booking
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cancellation confirmation dialog ── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Confirm Cancellation
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-sm">
              Please review the refund details before confirming.
            </DialogDescription>
          </DialogHeader>

          {booking && refundPreview && (
            <div className="space-y-4 py-1">
              {/* Booking summary */}
              <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Booking Ref</span>
                  <span className="font-mono font-bold text-stone-800">{booking.booking_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Facility</span>
                  <span className="font-medium text-stone-800">{(booking as any).facility?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Event Date</span>
                  <span className="font-medium text-stone-800">{formatDate(booking.booking_date)}</span>
                </div>
              </div>

              {/* Refund breakdown */}
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <div className="bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Refund Breakdown
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Amount Paid</span>
                    <span className="font-medium">{formatINR(Number(booking.total_amount))}</span>
                  </div>
                  {refundPreview.deductionAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Cancellation Charge ({refundPreview.deductionPercent}%)</span>
                      <span className="font-medium">− {formatINR(refundPreview.deductionAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-stone-100 font-semibold">
                    <span className={refundPreview.refundAmount > 0 ? "text-emerald-700" : "text-red-700"}>
                      {refundPreview.refundAmount > 0 ? "Refund Amount" : "No Refund"}
                    </span>
                    <span className={refundPreview.refundAmount > 0 ? "text-emerald-700" : "text-red-700"}>
                      {formatINR(refundPreview.refundAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy label */}
              <p className="text-xs text-stone-500 italic">{refundPreview.label}</p>

              {/* Warning */}
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  This action is <strong>irreversible</strong>. Once cancelled, the slot will be
                  released and you will need to rebook. Contact the clubhouse office for refund processing.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelLoading}>
              Keep My Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelLoading}
              className="gap-2"
            >
              {cancelLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Yes, Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
