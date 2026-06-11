"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { getFacilityAvailability } from "@/actions/bookings";
import { getBlockedDates } from "@/actions/facilities";
import { toDateString } from "@/lib/utils/dates";
import { format, addMonths } from "date-fns";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import type { FacilityWithMedia } from "@/types/database";
import type { BookingWizardState } from "@/types";

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
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
        const blockedDays: Date[] = [];
        for (const b of blocked) {
          const s = new Date(b.start_date + "T00:00:00");
          const e = new Date(b.end_date + "T00:00:00");
          for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            blockedDays.push(new Date(d));
          }
        }
        setDisabledDates(blockedDays);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month, facility.id]);

  const bookedDates = Object.entries(availability)
    .filter(([, v]) => v === "booked")
    .map(([d]) => new Date(d + "T00:00:00"));

  const allDisabled = [...disabledDates, ...bookedDates];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Select a Date</h2>
        <p className="text-sm text-stone-500 mt-1">Choose your preferred booking date</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Calendar box */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex-1 min-w-0">
          {loading && (
            <p className="text-xs text-stone-400 text-center mb-2 animate-pulse">Loading availability…</p>
          )}

          {/* Injected styles scoped to our calendar wrapper */}
          <style>{`
            .sc-cal .rdp-root {
              --rdp-accent-color: #1d4ed8;
              --rdp-accent-background-color: #dbeafe;
              --rdp-day-width: 40px;
              --rdp-day-height: 40px;
              font-family: inherit;
              width: 100%;
            }
            .sc-cal .rdp-month_caption {
              font-family: 'Playfair Display', serif;
              font-size: 1rem;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 8px;
            }
            .sc-cal .rdp-weekday {
              font-size: 0.7rem;
              font-weight: 600;
              color: #94a3b8;
              text-transform: uppercase;
            }
            .sc-cal .rdp-day button {
              border-radius: 8px;
              font-size: 0.875rem;
              font-weight: 500;
              color: #334155;
              width: 100%;
              height: 100%;
              transition: background 0.15s, color 0.15s;
            }
            .sc-cal .rdp-day button:hover:not(:disabled) {
              background: #dbeafe;
              color: #1d4ed8;
            }
            .sc-cal .rdp-selected button {
              background: #1d4ed8 !important;
              color: white !important;
              font-weight: 700;
              box-shadow: 0 2px 8px rgba(29,78,216,0.3);
            }
            .sc-cal .rdp-today button {
              border: 2px solid #3b82f6;
              color: #1d4ed8;
              font-weight: 700;
            }
            .sc-cal .rdp-disabled button {
              opacity: 0.3;
              cursor: not-allowed;
            }
            .sc-cal .rdp-nav button {
              border-radius: 8px;
              padding: 4px 8px;
              color: #475569;
              border: 1px solid #e2e8f0;
              background: white;
            }
            .sc-cal .rdp-nav button:hover {
              background: #f1f5f9;
            }
            /* Availability dots */
            .sc-cal .day-available button::after,
            .sc-cal .day-partial button::after,
            .sc-cal .day-booked button::after {
              content: '';
              display: block;
              width: 5px;
              height: 5px;
              border-radius: 50%;
              margin: 1px auto 0;
            }
            .sc-cal .day-available button::after { background: #22c55e; }
            .sc-cal .day-partial button::after  { background: #f59e0b; }
            .sc-cal .day-booked button::after   { background: #ef4444; }
            .sc-cal .rdp-selected.day-available button::after,
            .sc-cal .rdp-selected.day-partial button::after,
            .sc-cal .rdp-selected.day-booked button::after { display: none; }
          `}</style>

          <div className="sc-cal">
            <DayPicker
              mode="single"
              selected={state.selectedDate ?? undefined}
              onSelect={(date) => date && onStateChange({ selectedDate: date })}
              month={month}
              onMonthChange={setMonth}
              startMonth={new Date()}
              endMonth={addMonths(new Date(), 6)}
              disabled={[{ before: new Date() }, ...allDisabled]}
              modifiers={{
                "day-available": Object.entries(availability)
                  .filter(([, v]) => v === "available")
                  .map(([d]) => new Date(d + "T00:00:00")),
                "day-partial": Object.entries(availability)
                  .filter(([, v]) => v === "partial")
                  .map(([d]) => new Date(d + "T00:00:00")),
                "day-booked": bookedDates,
              }}
              modifiersClassNames={{
                "day-available": "day-available",
                "day-partial": "day-partial",
                "day-booked": "day-booked",
              }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:w-52 space-y-4 w-full">
          {/* Legend */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Legend</p>
            <div className="space-y-2.5">
              {[
                { dot: "bg-emerald-500", label: "Available" },
                { dot: "bg-amber-400",   label: "Partially Booked" },
                { dot: "bg-red-400",     label: "Fully Booked" },
                { dot: "bg-stone-300",   label: "Unavailable" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2.5 text-sm text-stone-600">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.dot}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Selected date */}
          {state.selectedDate ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Selected Date</p>
              </div>
              <p className="text-sm font-medium text-stone-600">{format(state.selectedDate, "EEEE")}</p>
              <p className="text-lg font-bold text-stone-900">{format(state.selectedDate, "d MMMM yyyy")}</p>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-stone-400" />
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">No date selected</p>
              </div>
              <p className="text-sm text-stone-400">Click a date on the calendar</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!state.selectedDate}
          className="text-white px-6 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
        >
          Continue to Package Selection →
        </Button>
      </div>
    </div>
  );
}
