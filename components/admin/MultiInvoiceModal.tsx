"use client";

/**
 * MultiInvoiceModal
 *
 * A polished admin popup that fetches all confirmed/completed bookings,
 * lets the admin search & select any subset, then downloads a consolidated PDF.
 */

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  FileText,
  X,
  Search,
  CheckSquare,
  Square,
  Download,
  Loader2,
  User,
  CalendarDays,
  Building2,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils/formatters";
import { formatShortDate } from "@/lib/utils/dates";
import type { Booking } from "@/types/database";

// ─── helpers ────────────────────────────────────────────────────────────────

function slotDisplay(b: Booking): string {
  if ((b as any).start_time && (b as any).end_time) {
    const fmt = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    };
    return `${fmt((b as any).start_time)} – ${fmt((b as any).end_time)}`;
  }
  return b.slot_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

type BookingRow = Booking & { facility?: { name: string } };

export function MultiInvoiceModal({ open, onClose }: Props) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);

  // ── Fetch bookings when dialog opens ──────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch("/api/invoice/multi/list");
      if (!res.ok) throw new Error("Failed to load bookings");
      const data: BookingRow[] = await res.json();
      setBookings(data);
      setFetched(true);
    } catch {
      toast.error("Could not load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  // Trigger fetch when dialog mounts
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) { onClose(); return; }
    fetchBookings();
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.customer_name.toLowerCase().includes(q) ||
        b.booking_ref.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        (b.facility?.name ?? "").toLowerCase().includes(q)
    );
  }, [bookings, search]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((b) => selected.has(b.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((b) => next.delete(b.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((b) => next.add(b.id));
        return next;
      });
    }
  };

  // ── Totals for selected ────────────────────────────────────────────────────
  const selectedBookings = bookings.filter((b) => selected.has(b.id));
  const selectedTotal = selectedBookings.reduce(
    (s, b) => s + Number(b.total_amount ?? 0),
    0
  );

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (selected.size === 0) {
      toast.warning("Please select at least one booking.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/invoice/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds: Array.from(selected) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to generate invoice.");
        return;
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Try to get filename from Content-Disposition
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "Invoice.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Invoice downloaded — ${selected.size} booking${selected.size !== 1 ? "s" : ""} included.`);
      onClose();
    } catch {
      toast.error("Something went wrong while generating the invoice.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <DialogHeader className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4.5 h-4.5 text-blue-700" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-stone-900">
                  Create Invoice
                </DialogTitle>
                <p className="text-xs text-stone-400 mt-0.5">
                  Select bookings to include in a single downloaded invoice
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── Search + Select All ───────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <Input
              placeholder="Search by name, ref, phone, facility…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-white"
            />
          </div>

          {!loading && fetched && filtered.length > 0 && (
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:underline whitespace-nowrap"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              {allFilteredSelected ? "Deselect all" : "Select all"}
              {search ? " (filtered)" : ""}
            </button>
          )}
        </div>

        {/* ── Booking list ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              <p className="text-sm">Loading bookings…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <FileText className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {search ? "No bookings match your search" : "No confirmed bookings found"}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {filtered.map((b) => {
                const isSelected = selected.has(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggle(b.id)}
                    className={`w-full text-left px-6 py-3.5 flex items-start gap-4 transition-colors hover:bg-stone-50 focus:outline-none ${
                      isSelected ? "bg-blue-50 hover:bg-blue-50" : ""
                    }`}
                  >
                    {/* Checkbox visual */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-stone-300" style={{ width: 18, height: 18 }} />
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              {b.booking_ref}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                b.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-violet-100 text-violet-700"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5 text-sm font-medium text-stone-900">
                            <User className="w-3 h-3 text-stone-400 flex-shrink-0" />
                            {b.customer_name}
                            <span className="text-xs text-stone-400 font-normal">
                              · {b.customer_phone}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-stone-500">
                              <Building2 className="w-3 h-3" />
                              {b.facility?.name ?? "—"}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-stone-500">
                              <CalendarDays className="w-3 h-3" />
                              {formatShortDate(b.booking_date)} · {slotDisplay(b)}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center gap-0.5 text-sm font-bold text-stone-900">
                            <IndianRupee className="w-3 h-3" />
                            {Number(b.total_amount).toLocaleString("en-IN")}
                          </div>
                          {Number(b.gst_percentage ?? 0) > 0 && (
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              incl. {b.gst_percentage}% GST
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer / summary bar ─────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-stone-100 px-6 py-4 bg-white flex items-center justify-between gap-4">
          <div className="text-sm text-stone-600">
            {selected.size === 0 ? (
              <span className="text-stone-400">No bookings selected</span>
            ) : (
              <>
                <span className="font-semibold text-stone-900">{selected.size}</span>
                {" "}booking{selected.size !== 1 ? "s" : ""} selected
                {" · "}
                <span className="font-semibold text-stone-900">{formatINR(selectedTotal)}</span>
                {" "}total
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0 || generating}
              onClick={handleDownload}
              style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
              className="text-white hover:opacity-90 gap-2 min-w-36"
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Download Invoice</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
