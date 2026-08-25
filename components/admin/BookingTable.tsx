"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, Filter, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { updateBookingStatus } from "@/actions/bookings";
import { formatShortDate, formatTimeDisplay } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/formatters";
import type { Booking, BookingStatus } from "@/types/database";
import Link from "next/link";

// ── AdminBookingsTable ───────────────────────────────────
interface BookingsTableProps {
  bookings: Booking[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];

export function AdminBookingsTable({ bookings, total, page, pageSize }: BookingsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; bookingId: string }>({ open: false, bookingId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(searchParams.get("search") ?? "");
  const totalPages = Math.ceil(total / pageSize);

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/dashboard/bookings?${params.toString()}`);
  }, [router, searchParams]);

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus, rejectionReason?: string) => {
    setLoadingId(bookingId);
    try {
      const res = await updateBookingStatus({ bookingId, status, rejectionReason });
      if (!res.success) { toast.error(res.error ?? "Failed"); return; }
      toast.success(`Booking ${status === "confirmed" ? "approved" : "updated"}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
      setRejectDialog({ open: false, bookingId: "" });
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by invoice #, name, ref, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilter("search", searchInput)}
            className="pl-9"
          />
        </div>
        <Select defaultValue={searchParams.get("status") ?? "all"} onValueChange={(v) => updateFilter("status", v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => updateFilter("search", searchInput)} className="gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Apply
        </Button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50">
              <tr>
                {["Inv #", "Ref", "Customer", "Facility", "Date", "Slot", "Amount", "Payment", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {bookings.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-stone-400">No bookings found</td></tr>
              ) : bookings.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50 transition-colors">
                  {/* Invoice # — prominent, navy coloured */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {(b as any).invoice_number ? (
                      <span className="inline-flex items-center justify-center w-9 h-6 rounded-md bg-[#0B3272] text-white text-xs font-bold tracking-wide">
                        {String((b as any).invoice_number).padStart(2, "0")}
                      </span>
                    ) : (
                      <span className="text-stone-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-stone-600 whitespace-nowrap">{b.booking_ref}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-stone-900 whitespace-nowrap">{b.customer_name}</div>
                    <div className="text-xs text-stone-400">{b.customer_phone}</div>
                    <div className="text-xs text-stone-400">{b.customer_email}</div>
                  </td>
                  <td className="py-3 px-4 text-stone-700 whitespace-nowrap">{(b as any).facility?.name ?? "—"}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-stone-600">{formatShortDate(b.booking_date)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-stone-600 text-xs">
                    {(() => {
                      const timeStr = b.start_time && b.end_time 
                        ? `${formatTimeDisplay(b.start_time)} – ${formatTimeDisplay(b.end_time)}` 
                        : null;
                      const typeStr = b.slot_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                      
                      if (b.slot_type === "hourly") {
                         return timeStr || typeStr;
                      } else {
                         return timeStr ? `${typeStr} (${timeStr})` : typeStr;
                      }
                    })()}
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-900 whitespace-nowrap">{formatINR(b.total_amount)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {(() => {
                      const mode = (b as any).payment_mode;
                      const type = (b as any).payment_type;
                      const raw = mode ?? type;
                      if (!raw) return <span className="text-stone-300 text-xs">—</span>;
                      const colorMap: Record<string, string> = {
                        cash: 'bg-green-100 text-green-800',
                        upi: 'bg-violet-100 text-violet-800',
                        cheque: 'bg-blue-100 text-blue-800',
                        bank_transfer: 'bg-cyan-100 text-cyan-800',
                        complimentary: 'bg-emerald-100 text-emerald-800',
                        deferred: 'bg-amber-100 text-amber-800',
                      };
                      const labelMap: Record<string, string> = {
                        cash: 'Cash',
                        upi: 'UPI',
                        cheque: 'Cheque',
                        bank_transfer: 'Bank Transfer',
                        complimentary: 'Complimentary',
                        deferred: 'Deferred',
                        other: 'Other',
                      };
                      const color = colorMap[raw] ?? 'bg-stone-100 text-stone-600';
                      const label = labelMap[raw] ?? raw.replace(/_/g, ' ').toUpperCase();
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <Link href={`/dashboard/bookings/${b.id}`}><Eye className="w-3.5 h-3.5" /></Link>
                      </Button>
                      {b.status === "pending_approval" && (
                        <>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-emerald-600 hover:bg-emerald-50"
                            disabled={loadingId === b.id} onClick={() => handleStatusUpdate(b.id, "confirmed")} title="Approve">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-red-600 hover:bg-red-50"
                            disabled={loadingId === b.id} onClick={() => setRejectDialog({ open: true, bookingId: b.id })} title="Reject">
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
            <p className="text-xs text-stone-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1))} className="gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateFilter("page", String(page + 1))} className="gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false, bookingId: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-stone-500">Reason will be emailed to the customer:</p>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment amount mismatch…" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, bookingId: "" })}>Cancel</Button>
            <Button variant="destructive" disabled={rejectReason.length < 10 || !!loadingId}
              onClick={() => handleStatusUpdate(rejectDialog.bookingId, "rejected", rejectReason)}>
              Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── UpcomingBookingsTable (dashboard) ────────────────────
export function UpcomingBookingsTable({ bookings }: { bookings: any[] }) {
  if (bookings.length === 0) {
    return <div className="text-center py-8 text-stone-400 text-sm">No upcoming confirmed bookings</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            {["Ref", "Customer", "Facility", "Date & Time", "Amount", "Status"].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-stone-50 transition-colors">
              <td className="py-3 px-3 font-mono text-xs text-stone-600">{b.booking_ref}</td>
              <td className="py-3 px-3">
                <div className="font-medium text-stone-900">{b.customer_name}</div>
                <div className="text-xs text-stone-400">{b.customer_phone}</div>
              </td>
              <td className="py-3 px-3 text-stone-700">{b.facility?.name ?? "—"}</td>
              <td className="py-3 px-3 text-stone-600">
                <div>{formatShortDate(b.booking_date)}</div>
                {b.start_time ? (
                  <div className="text-xs text-stone-400">
                    {b.slot_type !== "hourly" && <span className="capitalize">{b.slot_type.replace(/_/g, " ")}: </span>}
                    {formatTimeDisplay(b.start_time)} – {b.end_time ? formatTimeDisplay(b.end_time) : ""}
                  </div>
                ) : (
                  <div className="text-xs text-stone-400 capitalize">
                    {b.slot_type.replace(/_/g, " ")}
                  </div>
                )}
              </td>
              <td className="py-3 px-3 font-medium text-stone-900">{formatINR(b.total_amount)}</td>
              <td className="py-3 px-3"><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
