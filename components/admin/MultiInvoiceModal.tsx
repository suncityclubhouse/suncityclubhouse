"use client";

/**
 * MultiInvoiceModal
 *
 * A polished admin popup that fetches all confirmed/completed bookings,
 * lets the admin search & select any subset, then downloads a consolidated PDF.
 *
 * Uses a native <dialog> / fixed overlay instead of Radix Dialog to avoid
 * portal event-propagation quirks that can silently break controlled inputs.
 */

import { useState, useEffect, useRef } from "react";
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
import { formatINR } from "@/lib/utils/formatters";
import { formatShortDate } from "@/lib/utils/dates";
import type { Booking } from "@/types/database";

import { getConfirmedBookingsForInvoice } from "@/actions/invoice";

// ─── helpers ─────────────────────────────────────────────────────────────────

function slotDisplay(b: Booking): string {
  const st = (b as any).start_time;
  const et = (b as any).end_time;
  if (st && et) {
    const fmt = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    };
    return `${fmt(st)} – ${fmt(et)}`;
  }
  return b.slot_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getFacilityName(b: any): string {
  const f = b.facility;
  if (!f) return "";
  if (Array.isArray(f)) return (f[0]?.name ?? "").toLowerCase();
  return (f.name ?? "").toLowerCase();
}

// ─── types ───────────────────────────────────────────────────────────────────

type BookingRow = Booking & { facility?: { id: string; name: string } | Array<{ id: string; name: string }> };

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MultiInvoiceModal({ open, onClose }: Props) {
  const [bookings, setBookings]   = useState<BookingRow[]>([]);
  const [loading, setLoading]     = useState(false);
  const [fetched, setFetched]     = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [search, setSearch]       = useState("");
  const [generating, setGenerating] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Fetch on first open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (fetched) {
      // Already loaded — just re-focus the search box
      setTimeout(() => searchRef.current?.focus(), 50);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getConfirmedBookingsForInvoice()
      .then((data: BookingRow[]) => {
        if (cancelled) return;
        // Sort by created_at descending (latest first)
        const sorted = [...data].sort((a, b) =>
          new Date((b as any).created_at ?? 0).getTime() -
          new Date((a as any).created_at ?? 0).getTime()
        );
        setBookings(sorted);
        setFetched(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load bookings. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset state on close ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
    }
  }, [open]);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ── Filter — plain computation, guaranteed fresh on every render ──────────
  const q = search.trim().toLowerCase();
  const filtered: BookingRow[] = q
    ? bookings.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(q) ||
          b.booking_ref.toLowerCase().includes(q) ||
          b.customer_phone.includes(q) ||
          getFacilityName(b).includes(q)
      )
    : bookings;

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((b) => selected.has(b.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((b) => next.delete(b.id));
      } else {
        filtered.forEach((b) => next.add(b.id));
      }
      return next;
    });
  };

  // ── Summary ───────────────────────────────────────────────────────────────
  const selectedTotal = bookings
    .filter((b) => selected.has(b.id))
    .reduce((s, b) => s + Number(b.total_amount ?? 0), 0);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (selected.size === 0) { toast.warning("Please select at least one booking."); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/invoice/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as any).error ?? "Failed to generate invoice.");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const cd   = res.headers.get("Content-Disposition") ?? "";
      const m    = cd.match(/filename="([^"]+)"/);
      a.download = m?.[1] ?? "Invoice.pdf";
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

  if (!open) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="multi-invoice-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-stone-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="text-blue-700" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h2 id="multi-invoice-title" className="text-base font-semibold text-stone-900">
                  Create Invoice
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Select bookings to include in a single downloaded PDF
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* ── Search bar ──────────────────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-stone-50 border-b border-stone-100">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                style={{ width: 14, height: 14 }}
              />
              {/* Native input for maximum reliability */}
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ref, phone, or facility…"
                className="w-full pl-8 pr-3 h-8 text-sm border border-stone-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-stone-400"
              />
            </div>

            {!loading && fetched && bookings.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:underline whitespace-nowrap flex-shrink-0"
              >
                {allFilteredSelected ? (
                  <CheckSquare style={{ width: 14, height: 14 }} />
                ) : (
                  <Square style={{ width: 14, height: 14 }} />
                )}
                {allFilteredSelected ? "Deselect all" : "Select all"}
                {q ? " (filtered)" : ""}
              </button>
            )}
          </div>

          {/* ── Count badge ─────────────────────────────────────────────── */}
          {!loading && fetched && (
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-1.5 bg-stone-50 border-b border-stone-100 text-xs text-stone-400">
              <span>
                {q
                  ? `${filtered.length} of ${bookings.length} bookings match`
                  : `${bookings.length} confirmed / completed booking${bookings.length !== 1 ? "s" : ""}`}
              </span>
              {q && (
                <button
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  className="text-blue-600 hover:underline ml-3"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* ── Booking list ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                <Loader2 className="animate-spin mb-3" style={{ width: 24, height: 24 }} />
                <p className="text-sm">Loading bookings…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                <FileText className="mb-3 opacity-30" style={{ width: 32, height: 32 }} />
                <p className="text-sm font-medium">
                  {q ? "No bookings match your search" : "No confirmed bookings found"}
                </p>
                {q && (
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
                  const facilityName = getFacilityName(b) ||
                    (Array.isArray((b as any).facility)
                      ? (b as any).facility[0]?.name
                      : (b as any).facility?.name) ||
                    "—";

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggle(b.id)}
                      className={`w-full text-left px-5 py-3.5 flex items-start gap-4 transition-colors focus:outline-none focus-visible:bg-blue-50 ${
                        isSelected
                          ? "bg-blue-50 hover:bg-blue-50/80"
                          : "hover:bg-stone-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <CheckSquare className="text-blue-600" style={{ width: 18, height: 18 }} />
                        ) : (
                          <Square className="text-stone-300" style={{ width: 18, height: 18 }} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {/* Ref + status */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                {b.booking_ref}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                  b.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-violet-100 text-violet-700"
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>

                            {/* Customer */}
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm font-medium text-stone-900">
                              <User className="text-stone-400 flex-shrink-0" style={{ width: 12, height: 12 }} />
                              {b.customer_name}
                              <span className="text-xs text-stone-400 font-normal">
                                · {b.customer_phone}
                              </span>
                            </div>

                            {/* Facility + date */}
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-stone-500">
                                <Building2 style={{ width: 11, height: 11 }} />
                                {facilityName}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-stone-500">
                                <CalendarDays style={{ width: 11, height: 11 }} />
                                {formatShortDate(b.booking_date)} · {slotDisplay(b)}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="flex-shrink-0 text-right">
                            <div className="flex items-center gap-0.5 text-sm font-bold text-stone-900 justify-end">
                              <IndianRupee style={{ width: 12, height: 12 }} />
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

          {/* ── Footer ───────────────────────────────────────────────────── */}
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
                type="button"
                disabled={selected.size === 0 || generating}
                onClick={handleDownload}
                style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
                className="text-white hover:opacity-90 gap-2 min-w-36"
              >
                {generating ? (
                  <><Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> Generating…</>
                ) : (
                  <><Download style={{ width: 14, height: 14 }} /> Download Invoice</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
