"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { getFacilityAvailability } from "@/actions/bookings";
import { getBlockedDates } from "@/actions/facilities";
import { toDateString, isDateInPast } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/formatters";
import { format, addMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FacilityWithMedia } from "@/types/database";
import type { BookingWizardState } from "@/types";

// Legend colors
const LEGEND = [
  { color: "bg-emerald-500", label: "Available" },
  { color: "bg-amber-400", label: "Partially Booked" },
  { color: "bg-red-400", label: "Fully Booked" },
];

interface StepDateSelectProps {
  facility: FacilityWithMedia;
  state: BookingWizardState;
  onStateChange: (patch: Partial<BookingWizardState>) => void;
  onNext: () => void;
}

export function StepDateSelect({ facility, state, onStateChange, onNext }: StepDateSelectProps) {
  const [month, setMonth] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<Record<string, "available" | "partial" | "booked">>({});
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  // Load availability for the current month view
  useEffect(() => {
    const loadAvailability = async () => {
      setLoading(true);
      try {
        // Generate all dates in the visible month + next month
        const dates: string[] = [];
        const start = new Date(month.getFullYear(), month.getMonth(), 1);
        const end = new Date(month.getFullYear(), month.getMonth() + 2, 0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(toDateString(new Date(d)));
        }

        const [avail, blocked] = await Promise.all([
          getFacilityAvailability({ facilityId: facility.id, dates }),
          getBlockedDates(facility.id),
        ]);

        setAvailability(avail);

        // Convert blocked date ranges to individual dates
        const blockedDays: Date[] = [];
        for (const b of blocked) {
          const s = new Date(b.start_date);
          const e = new Date(b.end_date);
          for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            blockedDays.push(new Date(d));
          }
        }
        setDisabledDates(blockedDays);
      } finally {
        setLoading(false);
      }
    };
    loadAvailability();
  }, [month, facility.id]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onStateChange({ selectedDate: date });
  };

  const canProceed = !!state.selectedDate;

  // Custom day rendering to show availability colors
  const modifiers = {
    available: Object.entries(availability)
      .filter(([, v]) => v === "available")
      .map(([d]) => new Date(d + "T00:00:00")),
    partial: Object.entries(availability)
      .filter(([, v]) => v === "partial")
      .map(([d]) => new Date(d + "T00:00:00")),
    booked: Object.entries(availability)
      .filter(([, v]) => v === "booked")
      .map(([d]) => new Date(d + "T00:00:00")),
    blocked: disabledDates,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Select a Date</h2>
        <p className="text-sm text-stone-500 mt-1">Choose your preferred booking date</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex-1">
          {loading && (
            <div className="text-center py-2 text-xs text-stone-400">Loading availability…</div>
          )}
          <style>{`
            .rdp-day_selected { background-color: #8b6914 !important; color: white !important; }
            .rdp-day_today { border: 2px solid #d4a82e; }
            .rdp-day_available::after { content: ''; display: block; width: 5px; height: 5px; border-radius: 50%; background: #22c55e; margin: 0 auto; margin-top: 2px; }
            .rdp-day_partial::after  { content: ''; display: block; width: 5px; height: 5px; border-radius: 50%; background: #f59e0b; margin: 0 auto; margin-top: 2px; }
            .rdp-day_booked::after   { content: ''; display: block; width: 5px; height: 5px; border-radius: 50%; background: #ef4444; margin: 0 auto; margin-top: 2px; }
          `}</style>
          <DayPicker
            mode="single"
            selected={state.selectedDate ?? undefined}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersClassNames={{
              available: "rdp-day_available",
              partial: "rdp-day_partial",
              booked: "rdp-day_booked",
            }}
            disabled={[
              { before: new Date() },
              ...disabledDates,
              ...modifiers.booked,
            ]}
            startMonth={new Date()}
            endMonth={addMonths(new Date(), 6)}
          />
        </div>

        {/* Right panel */}
        <div className="space-y-4 lg:w-56">
          {/* Legend */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3">
              Availability Legend
            </h4>
            <div className="space-y-2">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-sm text-stone-600">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", l.color)} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Selected date display */}
          {state.selectedDate && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                Selected
              </p>
              <p className="text-sm font-semibold text-stone-900">
                {format(state.selectedDate, "EEEE")}
              </p>
              <p className="text-lg font-bold text-amber-700">
                {format(state.selectedDate, "d MMMM yyyy")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          style={{ backgroundColor: "#8b6914" }}
          className="text-white hover:opacity-90 disabled:opacity-40"
        >
          Continue to Package Selection →
        </Button>
      </div>
    </div>
  );
}
