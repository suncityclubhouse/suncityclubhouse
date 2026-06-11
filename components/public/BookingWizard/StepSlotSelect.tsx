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
import { Clock, Package, Loader2 } from "lucide-react";
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
  const [selectedHourlySlot, setSelectedHourlySlot] = useState<{ start: string; end: string } | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

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
  }, [facility.id, state.selectedDate]);

  const packages = facility.facility_packages.filter((p) => p.is_active);
  const hourlyPackages = packages.filter((p) => p.type === "hourly");
  const otherPackages = packages.filter((p) => p.type !== "hourly");
  const hourlySlots = generateHourlySlots();

  const handlePackageSelect = (pkg: FacilityPackage) => {
    setSelected(pkg);
    const needsSlot = pkg.type === "hourly" || pkg.type === "monthly";
    const endDate = state.selectedDate
      ? calculateEndDate(state.selectedDate, pkg.type)
      : null;
    if (!needsSlot) {
      setSelectedHourlySlot(null);
      onStateChange({
        selectedPackageId: pkg.id,
        slotType: pkg.type,
        startTime: pkg.start_time ?? null,
        endTime: pkg.end_time ?? null,
        endDate,
        totalAmount: pkg.price,
      });
    } else {
      setSelectedHourlySlot(null);
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

  const handleHourlySlotSelect = (slot: { start: string; end: string }) => {
    if (!selected) return;
    setSelectedHourlySlot(slot);
    onStateChange({
      startTime: slot.start,
      endTime: slot.end,
      totalAmount: selected.price,
    });
  };

  const needsTimeSlot = selected?.type === "hourly" || selected?.type === "monthly";
  const canProceed =
    selected &&
    (!needsTimeSlot || selectedHourlySlot !== null);

  const handleContinue = async () => {
    if (!selected || !state.selectedDate) return;
    setLoading(true);
    try {
      const endDate = calculateEndDate(state.selectedDate, selected.type) ?? undefined;
      const res = await createTemporaryReservation({
        facilityId: facility.id,
        bookingDate: toDateString(state.selectedDate),
        slotType: selected.type,
        startTime: needsTimeSlot ? selectedHourlySlot?.start : selected.start_time ?? undefined,
        endTime: needsTimeSlot ? selectedHourlySlot?.end : selected.end_time ?? undefined,
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
                  />
                ))}
              </div>
            </div>
          )}

          {/* Package-type options */}
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
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hourly time slots grid */}
          {needsTimeSlot && selected && (
            <div className="mt-4 bg-stone-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-stone-700">Choose a time slot:</p>
                {loadingSlots && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {hourlySlots.map((slot) => {
                  const isBooked = bookedSlots.some(
                    (b) => {
                      const bStart = b.start_time.slice(0, 5);
                      const bEnd = b.end_time.slice(0, 5);
                      return (
                        (slot.startTime >= bStart && slot.startTime < bEnd) ||
                        (slot.endTime > bStart && slot.endTime <= bEnd) ||
                        (slot.startTime <= bStart && slot.endTime >= bEnd)
                      );
                    }
                  );
                  
                  return (
                    <button
                      key={slot.startTime}
                      disabled={isBooked}
                      onClick={() => handleHourlySlotSelect({ start: slot.startTime, end: slot.endTime })}
                      className={cn(
                        "py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center",
                        isBooked
                          ? "bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-70"
                          : selectedHourlySlot?.start === slot.startTime
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-200 bg-white hover:border-blue-400 text-slate-700"
                      )}
                    >
                      {slot.label.split("–")[0].trim()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {canProceed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-600">Total Amount</p>
            <p className="text-xl font-bold text-stone-900">{formatINR(state.totalAmount)}</p>
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
