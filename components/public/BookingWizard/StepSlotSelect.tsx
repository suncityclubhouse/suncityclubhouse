"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/public/PricingCard";
import { createTemporaryReservation } from "@/actions/reservations";
import { getBookedTimeSlots } from "@/actions/bookings";
import { formatDisplayDate, toDateString } from "@/lib/utils/dates";
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
    if (pkg.type !== "hourly") {
      setSelectedHourlySlot(null);
      onStateChange({
        selectedPackageId: pkg.id,
        slotType: pkg.type,
        startTime: pkg.start_time ?? null,
        endTime: pkg.end_time ?? null,
        totalAmount: pkg.price,
      });
    }
  };

  const handleHourlySlotSelect = (slot: { start: string; end: string }) => {
    if (!selected || selected.type !== "hourly") return;
    setSelectedHourlySlot(slot);
    onStateChange({
      startTime: slot.start,
      endTime: slot.end,
      totalAmount: selected.price,
    });
  };

  const canProceed =
    selected &&
    (selected.type !== "hourly" || selectedHourlySlot !== null);

  const handleContinue = async () => {
    if (!selected || !state.selectedDate) return;
    setLoading(true);
    try {
      const res = await createTemporaryReservation({
        facilityId: facility.id,
        bookingDate: toDateString(state.selectedDate),
        slotType: selected.type,
        startTime: selected.type === "hourly" ? selectedHourlySlot?.start : selected.start_time ?? undefined,
        endTime: selected.type === "hourly" ? selectedHourlySlot?.end : selected.end_time ?? undefined,
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
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Select Package</h2>
        <p className="text-sm text-stone-500 mt-1">
          {state.selectedDate && formatDisplayDate(state.selectedDate)}
        </p>
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

              {/* Hourly time slots grid */}
              {selected?.type === "hourly" && (
                <div className="mt-4 bg-stone-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-stone-700">Choose a time slot:</p>
                    {loadingSlots && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {hourlySlots.map((slot) => {
                      const isBooked = bookedSlots.some(
                        (b) =>
                          (slot.startTime >= b.start_time && slot.startTime < b.end_time) ||
                          (slot.endTime > b.start_time && slot.endTime <= b.end_time) ||
                          (slot.startTime <= b.start_time && slot.endTime >= b.end_time)
                      );
                      
                      return (
                        <button
                          key={slot.startTime}
                          disabled={isBooked}
                          onClick={() => handleHourlySlotSelect({ start: slot.startTime, end: slot.endTime })}
                          className={cn(
                            "py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center",
                            isBooked
                              ? "bg-stone-200 border-stone-200 text-stone-400 cursor-not-allowed line-through opacity-70"
                              : selectedHourlySlot?.start === slot.startTime
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-stone-200 bg-white hover:border-amber-400 text-stone-700"
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

          {/* Package-type options */}
          {otherPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-stone-400" />
                <h3 className="text-sm font-semibold text-stone-700">Day Packages</h3>
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
        </div>
      )}

      {/* Summary */}
      {canProceed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
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
          style={{ backgroundColor: "#8b6914" }}
          className="text-white hover:opacity-90 disabled:opacity-40"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reserving…</> : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
