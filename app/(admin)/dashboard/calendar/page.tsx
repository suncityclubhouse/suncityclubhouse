import type { Metadata } from "next";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils/formatters";
import type { BookingStatus } from "@/types/database";
import { BlockDatesModal } from "@/components/admin/BlockDatesModal";

export const metadata: Metadata = { title: "Calendar | Admin" };

async function CalendarContent() {
  const db = createAdminClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: bookings } = await db
    .from("bookings")
    .select("id, booking_ref, booking_date, status, customer_name, facilities(name)")
    .not("status", "in", '("expired","cancelled")')
    .gte("booking_date", monthStart.toISOString().split("T")[0])
    .lte("booking_date", monthEnd.toISOString().split("T")[0])
    .order("booking_date");

  const { data: blockedDates } = await db
    .from("blocked_dates")
    .select("id, start_date, end_date, reason, facilities(name)")
    .gte("end_date", monthStart.toISOString().split("T")[0])
    .lte("start_date", monthEnd.toISOString().split("T")[0]);

  const { data: facilities } = await db
    .from("facilities")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Pad to start on Monday
  const startPad = (monthStart.getDay() + 6) % 7;

  const getBookingsForDay = (date: Date) =>
    (bookings ?? []).filter((b) =>
      isSameDay(new Date(b.booking_date + "T00:00:00"), date)
    );

  const getBlockedDatesForDay = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    return (blockedDates ?? []).filter(
      (bd) => bd.start_date <= dStr && bd.end_date >= dStr
    );
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6">
      {/* Month header & Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-32" /> {/* Spacer for centering */}
        <div className="text-center">
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            {format(today, "MMMM yyyy")}
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">All bookings this month</p>
        </div>
        <div className="w-32 flex justify-end">
          <BlockDatesModal facilities={facilities ?? []} adminId={user.id} />
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-stone-100 border border-stone-100 rounded-lg overflow-hidden">
        {/* Empty pads */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-stone-50 min-h-[80px]" />
        ))}

        {days.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const dayBlocked = getBlockedDatesForDay(day);
          const today_ = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-white min-h-[80px] p-1.5",
                today_ && "bg-amber-50"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                today_
                  ? "bg-blue-600 text-white"
                  : "text-stone-500"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayBlocked.map((bd) => (
                  <div
                    key={bd.id}
                    className="block text-[11px] px-1.5 py-0.5 rounded truncate leading-tight bg-red-100 text-red-800"
                    title={`Blocked: ${bd.reason} (${(bd as any).facilities?.name ?? "All Facilities"})`}
                  >
                    🔴 {(bd as any).facilities?.name ?? "All"} - {bd.reason}
                  </div>
                ))}
                {dayBookings.slice(0, 3).map((b) => (
                  <a
                    key={b.id}
                    href={`/dashboard/bookings/${b.id}`}
                    className={cn(
                      "block text-xs px-1.5 py-0.5 rounded truncate leading-tight",
                      b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                      b.status === "pending_approval" ? "bg-blue-100 text-blue-800" :
                      b.status === "awaiting_payment" ? "bg-amber-100 text-amber-800" :
                      "bg-stone-100 text-stone-600"
                    )}
                    title={`${(b as any).facilities?.name} — ${b.customer_name}`}
                  >
                    {(b as any).facilities?.name ?? b.booking_ref}
                  </a>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-xs text-stone-400 px-1">+{dayBookings.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-stone-500">
        {[
          { color: "bg-emerald-100 text-emerald-800", label: "Confirmed" },
          { color: "bg-blue-100 text-blue-800", label: "Pending Approval" },
          { color: "bg-amber-100 text-amber-800", label: "Awaiting Payment" },
          { color: "bg-red-100 text-red-800", label: "Blocked / Maintenance" },
          { color: "bg-stone-100 text-stone-600", label: "Other" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", l.color)}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Calendar</h1>
        <p className="text-sm text-stone-500 mt-1">Monthly booking overview</p>
      </div>
      <Suspense fallback={<div className="text-stone-400 text-sm">Loading calendar…</div>}>
        <CalendarContent />
      </Suspense>
    </div>
  );
}
