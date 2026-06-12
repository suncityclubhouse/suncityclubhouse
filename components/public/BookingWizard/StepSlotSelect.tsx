"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/public/PricingCard";
import { createTemporaryReservation } from "@/actions/reservations";
import { getBookedTimeSlots } from "@/actions/bookings";
import { formatDisplayDate, toDateString, calculateEndDate } from "@/lib/utils/dates";
import { generateHourlySlots } from "@/lib/utils/slots";
import { cn, formatINR } from "@/lib/utils/formatters";
import { Clock, Package, Loader2, Info } from "lucide-react";
import type { FacilityWithMedia, FacilityPackage } from "@/types/database";
import type { BookingWizardState } from "@/types";

interface StepSlotSelectProps {
  facility: FacilityWithMedia;
  state: BookingWizardState;
  onStateChange: (patch: Partial<BookingWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSlotSelect({ facility, state, onStateChange, onNext, onBack }: StepSlotSelectProps) {
  const [selected, setSelected] = useState<FacilityPackage | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Multi-slot range state
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  // "selecting" = user clicked start but not end yet
  const [selectingEnd, setSelectingEnd] = useState(false);

  useEffect(() => {
    async function loadBookedSlots() {
      if (!state.selectedDate) return;
      setLoadingSlots(true);
      try {
        const slots = await getBookedTimeSlots({
          facilityId: facility.id,
          date: toDateString(state.selectedDate),
        });
        setBookedSlots(slots);
      } catch (err) {
        console.error("Failed to load booked slots", err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadBookedSlots();
    // Reset range when date changes
    setRangeStart(null);
    setRangeEnd(null);
    setSelectingEnd(false);
  }, [facility.id, state.selectedDate]);

  const packages = facility.facility_packages.filter((p) => p.is_active);
  const hourlyPackages = packages.filter((p) => p.type === "hourly");
  const otherPackages = packages.filter((p) => p.type !== "hourly");
  const hourlySlots = generateHourlySlots();

  // ---- helpers ----

  const isSlotBooked = (slotStart: string, slotEnd: string) =>
    bookedSlots.some((b) => {
      const bStart = b.start_time.slice(0, 5);
      const bEnd = b.end_time.slice(0, 5);
      return (
        (slotStart >= bStart && slotStart < bEnd) ||
        (slotEnd > bStart && slotEnd <= bEnd) ||
        (slotStart <= bStart && slotEnd >= bEnd)
      );
    });

  // Check if ANY slot in a range [from..to] is booked
  const hasBookedSlotInRange = (fromStart: string, toEnd: string): boolean => {
    return hourlySlots.some(
      (s) =>
        s.startTime >= fromStart &&
        s.endTime <= toEnd &&
        isSlotBooked(s.startTime, s.endTime)
    );
  };

  // Slot label: "6 AM", "7 AM" … "10 PM"
  const slotLabel = (startTime: string) => {
    const [h] = startTime.split(":").map(Number);
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  // Hours selected in the current range
  const hoursSelected = (() => {
    if (!rangeStart || !rangeEnd) return 0;
    const startIdx = hourlySlots.findIndex((s) => s.startTime === rangeStart);
    const endIdx = hourlySlots.findIndex((s) => s.endTime === rangeEnd);
    return endIdx - startIdx + 1;
  })();

  const getSlotState = (slot: { startTime: string; endTime: string }) => {
    const booked = isSlotBooked(slot.startTime, slot.endTime);
    if (booked) return "booked";

    if (!rangeStart) return "available";

    // If still picking end — highlight hover range (we use CSS hover for that)
    if (rangeStart && rangeEnd) {
      const inRange =
        slot.startTime >= rangeStart && slot.endTime <= rangeEnd;
      if (slot.startTime === rangeStart) return "range-start";
      if (slot.endTime === rangeEnd) return "range-end";
      if (inRange) return "range-mid";
    } else {
      // Selecting end — mark the start
      if (slot.startTime === rangeStart) return "range-start";
    }
    return "available";
  };

  // ---- slot click handler ----
  const handleSlotClick = (slot: { startTime: string; endTime: string }) => {
    if (!selected) return;

    const booked = isSlotBooked(slot.startTime, slot.endTime);
    if (booked) {
      // Reset
      setRangeStart(null);
      setRangeEnd(null);
      setSelectingEnd(false);
      onStateChange({ startTime: null, endTime: null, totalAmount: selected.price });
      return;
    }

    if (!selectingEnd) {
      // First click — set start
      setRangeStart(slot.startTime);
      setRangeEnd(slot.endTime); // default: 1 hour (end = this slot's end)
      setSelectingEnd(true);
      onStateChange({
        startTime: slot.startTime,
        endTime: slot.endTime,
        totalAmount: selected.price * 1,
      });
    } else {
      // Second click
      if (slot.startTime === rangeStart) {
        // Tap same slot → toggle off
        setRangeStart(null);
        setRangeEnd(null);
        setSelectingEnd(false);
        onStateChange({ startTime: null, endTime: null, totalAmount: selected.price });
        return;
      }

      if (slot.startTime < rangeStart!) {
        // Picked an earlier slot → restart selection from here
        setRangeStart(slot.startTime);
        setRangeEnd(slot.endTime);
        setSelectingEnd(true);
        onStateChange({
          startTime: slot.startTime,
          endTime: slot.endTime,
          totalAmount: selected.price * 1,
        });
        return;
      }

      // Picked a later slot — check no booked slots in between
      if (hasBookedSlotInRange(rangeStart!, slot.endTime)) {
        toast.error("One or more slots in this range are already booked. Please adjust your selection.");
        return;
      }

      const startIdx = hourlySlots.findIndex((s) => s.startTime === rangeStart);
      const endIdx = hourlySlots.findIndex((s) => s.endTime === slot.endTime);
      const hours = endIdx - startIdx + 1;

      setRangeEnd(slot.endTime);
      setSelectingEnd(false);
      onStateChange({
        startTime: rangeStart!,
        endTime: slot.endTime,
        totalAmount: selected.price * hours,
      });
    }
  };

  // ---- package select ----
  const handlePackageSelect = (pkg: FacilityPackage) => {
    setSelected(pkg);
    // Reset range on package switch
    setRangeStart(null);
    setRangeEnd(null);
    setSelectingEnd(false);

    const needsSlot = pkg.type === "hourly" || pkg.type === "monthly";
    const endDate = state.selectedDate ? calculateEndDate(state.selectedDate, pkg.type) : null;

    if (!needsSlot) {
      onStateChange({
        selectedPackageId: pkg.id,
        slotType: pkg.type,
        startTime: pkg.start_time ?? null,
        endTime: pkg.end_time ?? null,
        endDate,
        totalAmount: pkg.price,
      });
    } else {
      onStateChange({
        selectedPackageId: pkg.id,
        slotType: pkg.type,
        startTime: null,
        endTime: null,
        endDate,
        totalAmount: pkg.price,
      });
    }
  };

  const needsTimeSlot = selected?.type === "hourly" || selected?.type === "monthly";
  const hasValidRange = rangeStart !== null && rangeEnd !== null;
  const canProceed = selected && (!needsTimeSlot || hasValidRange);

  // Resident pricing — read from shared wizard state (set by the popup)
  const isResident = state.isResident;
  const hasResidentPrice = selected !== null && selected.resident_price !== null && selected.resident_price < selected.price;
  const effectivePrice = isResident && hasResidentPrice ? selected!.resident_price! : (selected?.price ?? 0);

  const handleContinue = async () => {
    if (!selected || !state.selectedDate) return;
    setLoading(true);
    try {
      const endDate = calculateEndDate(state.selectedDate, selected.type) ?? undefined;
      const startTime = needsTimeSlot ? rangeStart ?? undefined : selected.start_time ?? undefined;
      const endTime = needsTimeSlot ? rangeEnd ?? undefined : selected.end_time ?? undefined;

      // Compute the final amount based on resident status
      let finalAmount: number;
      if (needsTimeSlot && hasValidRange) {
        const startIdx = hourlySlots.findIndex((s) => s.startTime === (startTime ?? ""));
        const endIdx = hourlySlots.findIndex((s) => s.endTime === (endTime ?? ""));
        const hours = endIdx - startIdx + 1;
        finalAmount = effectivePrice * hours;
      } else {
        finalAmount = effectivePrice;
      }

      const res = await createTemporaryReservation({
        facilityId: facility.id,
        bookingDate: toDateString(state.selectedDate),
        slotType: selected.type,
        startTime,
        endTime,
        endDate,
      });

      if (!res.success) {
        toast.error(res.error ?? "Slot not available");
        return;
      }

      onStateChange({
        sessionToken: res.data!.sessionToken,
        reservationExpiresAt: res.data!.expiresAt,
        selectedPackageId: selected.id,
        slotType: selected.type,
        endDate: endDate ?? null,
        totalAmount: finalAmount,
        isResident,
      });
      onNext();
    } catch {
      toast.error("Failed to hold the slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Formatted range label for summary
  const rangeLabel = (() => {
    if (!rangeStart || !rangeEnd) return null;
    return `${slotLabel(rangeStart)} – ${rangeEnd}`;
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-semibold text-stone-900">Select Package</h2>
          <p className="text-sm text-stone-500 mt-1">
            {state.selectedDate && formatDisplayDate(state.selectedDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="booking-date" className="text-sm font-medium text-stone-700">Date:</label>
          <input
            id="booking-date"
            type="date"
            min={toDateString(new Date())}
            value={state.selectedDate ? toDateString(state.selectedDate) : toDateString(new Date())}
            onChange={(e) => {
              if (e.target.value) {
                onStateChange({ selectedDate: new Date(e.target.value + "T00:00:00") });
              }
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-10 text-stone-400">
          No packages available. Please contact the admin.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hourly packages */}
          {hourlyPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-700">Hourly Slots</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hourlyPackages.map((pkg) => (
                  <PricingCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selected?.id === pkg.id}
                    onSelect={handlePackageSelect}
                    isResident={isResident}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Non-hourly packages */}
          {otherPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-700">Packages</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherPackages.map((pkg) => (
                  <PricingCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selected?.id === pkg.id}
                    onSelect={handlePackageSelect}
                    isResident={isResident}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hourly time slot grid */}
          {needsTimeSlot && selected && (
            <div className="mt-4 bg-stone-50 rounded-xl p-4 space-y-3">
              {/* Instruction banner */}
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-stone-600">
                  {selectingEnd
                    ? "Now tap the slot where you want to end — or tap the same slot for just 1 hour."
                    : "Tap a slot to start. Tap another to extend the range."}
                </p>
                {loadingSlots && <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto flex-shrink-0" />}
              </div>

              {/* Slot grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {hourlySlots.map((slot) => {
                  const state = getSlotState(slot);
                  const isStart = state === "range-start";
                  const isEnd = state === "range-end";
                  const isMid = state === "range-mid";
                  const isBooked = state === "booked";

                  return (
                    <button
                      key={slot.startTime}
                      disabled={isBooked}
                      onClick={() => handleSlotClick(slot)}
                      title={isBooked ? "Already booked" : slot.label}
                      className={cn(
                        "py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center select-none",
                        isBooked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-60"
                          : isStart || isEnd
                          ? "bg-blue-600 border-blue-600 text-white shadow-md"
                          : isMid
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-700 cursor-pointer"
                      )}
                    >
                      {slotLabel(slot.startTime)}
                    </button>
                  );
                })}
              </div>

              {/* Live range indicator */}
              {rangeStart && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1 border-t border-stone-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                    <span>Selected (start / end)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300 inline-block" />
                    <span>In range</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
                    <span>Booked</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* Summary bar */}
      {canProceed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Total Amount</p>
              <p className="text-xl font-bold text-stone-900">
                {formatINR(
                  needsTimeSlot && hasValidRange && hoursSelected > 0
                    ? effectivePrice * hoursSelected
                    : effectivePrice
                )}
              </p>
            </div>
            {needsTimeSlot && hasValidRange && hoursSelected > 0 && (
              <div className="text-right">
                <p className="text-xs text-stone-500 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-blue-700">
                  {hoursSelected} hr{hoursSelected > 1 ? "s" : ""}
                  {hoursSelected > 1 && (
                    <span className="text-xs font-normal text-stone-400 ml-1">
                      ({formatINR(effectivePrice)}/hr)
                    </span>
                  )}
                </p>
                {selectingEnd && (
                  <p className="text-xs text-amber-600 mt-0.5">Tap another slot to extend</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button
          onClick={handleContinue}
          disabled={!canProceed || loading}
          style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
          className="text-white hover:opacity-90 disabled:opacity-40"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reserving…</> : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
