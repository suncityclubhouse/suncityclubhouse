import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getBookingById } from "@/actions/bookings";
import { formatDisplayDate, formatTimeDisplay } from "@/lib/utils/dates";
import { formatINR, optimizeCloudinaryUrl } from "@/lib/utils/formatters";
import { BookingActionsPanel } from "./BookingActionsPanel";

export const metadata: Metadata = { title: "Booking Detail | Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getBookingById(id);

  if (!result.success || !result.data) notFound();

  const b = result.data as any;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-6">
        <Link href="/dashboard/bookings" className="hover:text-stone-600 transition-colors">Bookings</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-stone-700 font-mono">{b.booking_ref}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">{b.booking_ref}</h1>
          <StatusBadge status={b.status} />
        </div>
        <BookingActionsPanel booking={b} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Customer info */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm uppercase tracking-wider">Customer Details</h2>
          <Separator />
          {[
            { label: "Full Name", value: b.customer_name },
            { label: "Email", value: b.customer_email },
            { label: "Phone", value: b.customer_phone },
            { label: "Type", value: b.is_resident ? "Resident" : "Outsider" },
            { label: "House/Flat", value: b.house_number ?? "—" },
            { label: "Reference", value: b.reference_resident ?? "—" },
            { label: "Event Purpose", value: b.event_purpose },
            { label: "Guest Count", value: b.guest_count ? String(b.guest_count) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3 text-sm">
              <span className="text-stone-500 flex-shrink-0">{label}</span>
              <span className="text-stone-900 font-medium text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Booking details */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm uppercase tracking-wider">Booking Details</h2>
          <Separator />
          {[
            { label: "Facility", value: b.facility?.name ?? "—" },
            { label: "Date", value: formatDisplayDate(b.booking_date) },
            ...(b.end_date && b.end_date !== b.booking_date
              ? [{ label: "End Date", value: formatDisplayDate(b.end_date) }]
              : []),
            {
              label: "Slot",
              value: b.start_time && b.end_time
                ? `${formatTimeDisplay(b.start_time)} – ${formatTimeDisplay(b.end_time)}`
                : b.slot_type.replace(/_/g, " "),
            },
            { label: "Slot Type", value: b.slot_type.replace(/_/g, " ") },
            ...(b.quantity > 1 ? [{ label: "Rooms / Qty", value: `${b.quantity} rooms` }] : []),
            { label: "Base Amount", value: formatINR(b.base_amount) },
            { label: "Total Amount", value: formatINR(b.total_amount) },
            {
              label: "Booked At",
              value: new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3 text-sm">
              <span className="text-stone-500 flex-shrink-0">{label}</span>
              <span className="text-stone-900 font-medium text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Payment proof */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm uppercase tracking-wider">Payment</h2>
          <Separator />
          {[
            { label: "Reference/UTR", value: b.payment_reference ?? "Not yet provided" },
            {
              label: "Uploaded At",
              value: b.payment_uploaded_at
                ? new Date(b.payment_uploaded_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3 text-sm">
              <span className="text-stone-500 flex-shrink-0">{label}</span>
              <span className="text-stone-900 font-medium text-right">{value}</span>
            </div>
          ))}

          {/* Payment proof image */}
          {b.payment_proof_url && (
            <div className="mt-3">
              <p className="text-xs text-stone-500 mb-2">Payment Screenshot:</p>
              <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-50" style={{ height: 220 }}>
                <Image
                  src={optimizeCloudinaryUrl(b.payment_proof_url)}
                  alt="Payment proof"
                  fill
                  sizes="400px"
                  className="object-contain"
                />
              </div>
              <a
                href={b.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Open full size
              </a>
            </div>
          )}
        </div>

        {/* Admin notes */}
        {(b.admin_notes || b.rejection_reason || b.approved_at) && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <h2 className="font-medium text-stone-900 text-sm uppercase tracking-wider">Admin Notes</h2>
            <Separator />
            {b.admin_notes && (
              <div className="text-sm text-stone-700">
                <span className="text-stone-500 block text-xs mb-1">Notes:</span>
                {b.admin_notes}
              </div>
            )}
            {b.rejection_reason && (
              <div className="text-sm text-red-700 bg-red-50 rounded-lg p-3">
                <span className="font-medium">Rejection reason:</span> {b.rejection_reason}
              </div>
            )}
            {b.approved_at && (
              <div className="text-xs text-stone-400">
                Approved at: {new Date(b.approved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
