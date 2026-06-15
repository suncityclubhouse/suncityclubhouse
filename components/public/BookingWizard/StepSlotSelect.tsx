"use client";

import { useState, useEffect, useRef } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/public/PricingCard";
import { createTemporaryReservation } from "@/actions/reservations";
import { getBookedTimeSlots } from "@/actions/bookings";
import { formatDisplayDate, formatShortDate, toDateString, calculateEndDate } from "@/lib/utils/dates";
import { generateHourlySlots } from "@/lib/utils/slots";
import { cn, formatINR } from "@/lib/utils/formatters";
import { Calendar, Clock, Package, Loader2, Info, ArrowRight, Minus, Plus } from "lucide-react";
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
  const isAccommodation = facility.category === "accommodation";
  const maxQuantity = facility.inventory_count ?? 1;

  const [selected, setSelected] = useState<FacilityPackage | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Multi-day state — lives at the top, independent of package selection
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDateStr, setEndDateStr] = useState<string>(""); // "yyyy-MM-dd"

  // Multi-slot range state (hourly)
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
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
    // Reset hourly range when date changes
    setRangeStart(null);
    setRangeEnd(null);
    setSelectingEnd(false);
  }, [facility.id, state.selectedDate]);

  const packages = facility.facility_packages.filter((p) => p.is_active);
  const hourlyPackages = packages.filter((p) => p.type === "hourly");
  // When multi-day is ON, only show full_day packages (hourly/monthly don't support multi-day)
  const otherPackages = packages.filter((p) => p.type !== "hourly");
  const filteredOtherPackages = isMultiDay
    ? otherPackages.filter((p) => p.type === "full_day")
    : otherPackages;
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

  const hasBookedSlotInRange = (fromStart: string, toEnd: string): boolean => {
    return hourlySlots.some(
      (s) =>
        s.startTime >= fromStart &&
        s.endTime <= toEnd &&
        isSlotBooked(s.startTime, s.endTime)
    );
  };

  const slotLabel = (startTime: string) => {
    const [h] = startTime.split(":").map(Number);
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

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
    if (rangeStart && rangeEnd) {
      const inRange = slot.startTime >= rangeStart && slot.endTime <= rangeEnd;
      if (slot.startTime === rangeStart) return "range-start";
      if (slot.endTime === rangeEnd) return "range-end";
      if (inRange) return "range-mid";
    } else {
      if (slot.startTime === rangeStart) return "range-start";
    }
    return "available";
  };

  // ---- slot click handler ----
  const handleSlotClick = (slot: { startTime: string; endTime: string }) => {
    if (!selected) return;
    const booked = isSlotBooked(slot.startTime, slot.endTime);
    if (booked) {
      setRangeStart(null);
      setRangeEnd(null);
      setSelectingEnd(false);
      onStateChange({ startTime: null, endTime: null, totalAmount: selected.price });
      return;
    }
    if (!selectingEnd) {
      setRangeStart(slot.startTime);
      setRangeEnd(slot.endTime);
      setSelectingEnd(true);
      onStateChange({ startTime: slot.startTime, endTime: slot.endTime, totalAmount: selected.price * 1 });
    } else {
      if (slot.startTime === rangeStart) {
        setRangeStart(null);
        setRangeEnd(null);
        setSelectingEnd(false);
        onStateChange({ startTime: null, endTime: null, totalAmount: selected.price });
        return;
      }
      if (slot.startTime < rangeStart!) {
        setRangeStart(slot.startTime);
        setRangeEnd(slot.endTime);
        setSelectingEnd(true);
        onStateChange({ startTime: slot.startTime, endTime: slot.endTime, totalAmount: selected.price * 1 });
        return;
      }
      if (hasBookedSlotInRange(rangeStart!, slot.endTime)) {
        toast.error("One or more slots in this range are already booked. Please adjust your selection.");
        return;
      }
      const startIdx = hourlySlots.findIndex((s) => s.startTime === rangeStart);
      const endIdx = hourlySlots.findIndex((s) => s.endTime === slot.endTime);
      const hours = endIdx - startIdx + 1;
      setRangeEnd(slot.endTime);
      setSelectingEnd(false);
      onStateChange({ startTime: rangeStart!, endTime: slot.endTime, totalAmount: selected.price * hours });
    }
  };

  // ---- package select ----
  const handlePackageSelect = (pkg: FacilityPackage) => {
    setSelected(pkg);
    setRangeStart(null);
    setRangeEnd(null);
    setSelectingEnd(false);

    const needsSlot = pkg.type === "hourly" || pkg.type === "monthly";
    // For full_day + multi-day: endDate = the user-chosen endDateStr (or start date for single day)
    let endDate: string | null;
    if (pkg.type === "full_day") {
      endDate = isMultiDay && endDateStr ? endDateStr : toDateString(state.selectedDate ?? new Date());
    } else {
      endDate = state.selectedDate ? calculateEndDate(state.selectedDate, pkg.type) : null;
    }

    const basePrice = pkg.price;
    const days = pkg.type === "full_day" ? daysCount : 1;

    if (!needsSlot) {
      onStateChange({
        selectedPackageId: pkg.id,
        slotType: pkg.type,
        startTime: pkg.start_time ?? null,
        endTime: pkg.end_time ?? null,
        endDate,
        totalAmount: basePrice * days,
      });
    } else {
      onStateChange({
        selectedPackageId: pkg.id,
        slotType: pkg.type,
        startTime: null,
        endTime: null,
        endDate,
        totalAmount: basePrice,
      });
    }
  };

  // ---- multi-day helpers ----
  const isFullDay = selected?.type === "full_day";

  // How many days? Always computed from top-level state, not package
  const daysCount = (() => {
    if (!isMultiDay || !state.selectedDate || !endDateStr) return 1;
    const startStr = toDateString(state.selectedDate);
    if (endDateStr <= startStr) return 1;
    return differenceInCalendarDays(parseISO(endDateStr), parseISO(startStr)) + 1;
  })();

  // When multi-day toggled ON: deselect any non-full_day package (they don't support multi-day)
  const handleMultiDayToggle = () => {
    const next = !isMultiDay;
    setIsMultiDay(next);
    if (!next) {
      setEndDateStr("");
    } else {
      // If currently selected package is not full_day, clear it
      if (selected && selected.type !== "full_day") {
        setSelected(null);
        onStateChange({ selectedPackageId: null, slotType: null, startTime: null, endTime: null, totalAmount: 0 });
      }
    }
  };

  // Resident pricing
  const isResident = state.isResident;
  const hasResidentPrice = selected !== null && selected.resident_price !== null && selected.resident_price < selected.price;
  const effectivePrice = isResident && hasResidentPrice ? selected!.resident_price! : (selected?.price ?? 0);

  // Recalculate amount when days/dates/resident/package changes (for full_day)
  useEffect(() => {
    if (!selected || !isFullDay) return;
    const price = isResident && selected.resident_price !== null && selected.resident_price < selected.price
      ? selected.resident_price!
      : selected.price;
    onStateChange({
      totalAmount: price * daysCount,
      endDate: isMultiDay && endDateStr ? endDateStr : toDateString(state.selectedDate ?? new Date()),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysCount, isMultiDay, endDateStr, state.selectedDate, isResident, selected?.id]);

  const needsTimeSlot = selected?.type === "hourly" || selected?.type === "monthly";
  const hasValidRange = rangeStart !== null && rangeEnd !== null;
  const canProceed = selected && (!needsTimeSlot || hasValidRange);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canProceed && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [canProceed, rangeEnd, selected?.id]);

  const handleContinue = async () => {
    if (!selected || !state.selectedDate) return;
    setLoading(true);
    try {
      let endDate: string | undefined;
      if (isFullDay) {
        endDate = isMultiDay && endDateStr ? endDateStr : toDateString(state.selectedDate);
      } else {
        endDate = calculateEndDate(state.selectedDate, selected.type) ?? undefined;
      }

      const startTime = needsTimeSlot ? rangeStart ?? undefined : selected.start_time ?? undefined;
      const endTime = needsTimeSlot ? rangeEnd ?? undefined : selected.end_time ?? undefined;

      let finalAmount: number;
      if (needsTimeSlot && hasValidRange) {
        const startIdx = hourlySlots.findIndex((s) => s.startTime === (startTime ?? ""));
        const endIdx = hourlySlots.findIndex((s) => s.endTime === (endTime ?? ""));
        const hours = endIdx - startIdx + 1;
        finalAmount = effectivePrice * hours;
      } else if (isFullDay) {
        finalAmount = effectivePrice * daysCount;
      } else {
        finalAmount = effectivePrice;
      }
      // For accommodation: multiply by number of rooms selected
      if (isAccommodation) finalAmount = finalAmount * state.quantity;

      const res = await createTemporaryReservation({
        facilityId: facility.id,
        bookingDate: toDateString(state.selectedDate),
        slotType: selected.type,
        startTime,
        endTime,
        endDate,
        quantity: isAccommodation ? state.quantity : 1,
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

  return (
    <div className="space-y-5">

      {/* ── Header: title + date range picker ─────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-serif font-semibold text-stone-900">Select Package</h2>
          <p className="text-sm text-stone-500 mt-0.5">Choose your dates, then pick a package below</p>
        </div>

        {/* Date range card — always visible */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">

          {/* Toggle row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <span className="text-sm font-medium text-stone-700">Book for multiple days?</span>
            </div>
            <button
              id="multi-day-toggle"
              type="button"
              role="switch"
              aria-checked={isMultiDay}
              onClick={handleMultiDayToggle}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 flex-shrink-0",
                isMultiDay ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
              )}
            >
              <span
                className={cn(
                  "inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-0.5",
                  isMultiDay ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Quantity picker — accommodation only */}
          {isAccommodation && (
            <div className="flex items-center justify-between border-t border-stone-200 pt-3">
              <span className="text-sm font-medium text-stone-700">Number of Rooms</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, state.quantity - 1);
                    onStateChange({ quantity: next });
                  }}
                  disabled={state.quantity <= 1}
                  className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-lg font-bold text-stone-900 w-5 text-center">{state.quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(maxQuantity, state.quantity + 1);
                    onStateChange({ quantity: next });
                  }}
                  disabled={state.quantity >= maxQuantity}
                  className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Date inputs */}
          <div className={cn(
            "grid gap-3",
            isMultiDay ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          )}>
            {/* Start / single date */}
            <div className="space-y-1">
              <label htmlFor="booking-date" className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
                {isMultiDay ? "Start Date" : "Date"}
              </label>
              <input
                id="booking-date"
                type="date"
                min={toDateString(new Date())}
                value={state.selectedDate ? toDateString(state.selectedDate) : toDateString(new Date())}
                onChange={(e) => {
                  if (e.target.value) {
                    onStateChange({ selectedDate: new Date(e.target.value + "T00:00:00") });
                    if (endDateStr && endDateStr < e.target.value) setEndDateStr("");
                  }
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End date — only when multi-day */}
            {isMultiDay && (
              <div className="space-y-1">
                <label htmlFor="end-date" className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  min={state.selectedDate ? toDateString(state.selectedDate) : toDateString(new Date())}
                  value={endDateStr || (state.selectedDate ? toDateString(state.selectedDate) : "")}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Duration pill — shown when multi-day and dates differ */}
          {isMultiDay && daysCount > 1 && (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {formatShortDate(state.selectedDate!)}
                <ArrowRight className="inline w-3 h-3 mx-1.5 opacity-60" />
                {formatShortDate(parseISO(endDateStr))}
                <span className="ml-2 font-bold">· {daysCount} days</span>
              </span>
            </div>
          )}

          {/* Hint when multi-day is on */}
          {isMultiDay && daysCount === 1 && (
            <p className="text-xs text-stone-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Set an end date later than the start date to book multiple days
            </p>
          )}
        </div>
      </div>

      {/* ── Package list ───────────────────────────────────────── */}
      {packages.length === 0 ? (
        <div className="text-center py-10 text-stone-400">
          No packages available. Please contact the admin.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hourly packages — hidden when multi-day is on */}
          {!isMultiDay && hourlyPackages.length > 0 && (
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
          {filteredOtherPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-700">
                  {isMultiDay ? "Multi-day Packages" : "Packages"}
                </h3>
                {isMultiDay && daysCount > 1 && selected?.type === "full_day" && (
                  <span className="ml-auto text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    Price shown × {daysCount} days
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredOtherPackages.map((pkg) => (
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

          {/* No full-day packages available for multi-day */}
          {isMultiDay && filteredOtherPackages.length === 0 && (
            <div className="text-center py-6 text-stone-400 text-sm border border-dashed border-stone-200 rounded-xl">
              No full-day packages available for multi-day bookings.
            </div>
          )}

          {/* Hourly time slot grid */}
          {needsTimeSlot && selected && (
            <div className="mt-4 bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-stone-600">
                  {selectingEnd
                    ? "Now tap the slot where you want to end — or tap the same slot for just 1 hour."
                    : "Tap a slot to start. Tap another to extend the range."}
                </p>
                {loadingSlots && <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto flex-shrink-0" />}
              </div>

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

      {/* ── Summary bar ───────────────────────────────────────── */}
      {canProceed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Total Amount</p>
              <p className="text-xl font-bold text-stone-900">
                {formatINR(
                  (needsTimeSlot && hasValidRange && hoursSelected > 0
                    ? effectivePrice * hoursSelected
                    : isFullDay
                    ? effectivePrice * daysCount
                    : effectivePrice) * (isAccommodation ? state.quantity : 1)
                )}
              </p>
              {isAccommodation && state.quantity > 1 && (
                <p className="text-xs text-stone-400 mt-0.5">{state.quantity} units × {formatINR(effectivePrice)}</p>
              )}
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
            {isFullDay && daysCount > 1 && (
              <div className="text-right">
                <p className="text-xs text-stone-500 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-blue-700">
                  {daysCount} day{daysCount > 1 ? "s" : ""}
                  <span className="text-xs font-normal text-stone-400 ml-1">
                    ({formatINR(effectivePrice)}/day)
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} className="flex justify-between mt-4">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button
          onClick={handleContinue}
          disabled={!canProceed || loading}
          style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
          className="text-white hover:opacity-90 disabled:opacity-40"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reserving…</> : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
