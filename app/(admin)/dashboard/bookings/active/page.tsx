import type { Metadata } from "next";
import { Suspense } from "react";
import { getActiveBookings } from "@/actions/bookings";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/formatters";
import { ShieldCheck, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Booking } from "@/types/database";

export const metadata: Metadata = { title: "Active Bookings | Admin" };

async function ActiveBookingsList() {
  const result = await getActiveBookings();

  if (!result.success) {
    return <div className="text-red-500 text-sm">Failed to load active bookings: {result.error}</div>;
  }

  const bookings = result.data!;

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
        <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-stone-900">No active bookings</h3>
        <p className="text-sm text-stone-500 mt-1">There are no current bookings that are expiring in the future.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-stone-500 uppercase tracking-wider text-xs">Customer</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-500 uppercase tracking-wider text-xs">Facility & Package</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-500 uppercase tracking-wider text-xs">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-500 uppercase tracking-wider text-xs">Expiry Date</th>
              <th className="text-right py-3 px-4 font-semibold text-stone-500 uppercase tracking-wider text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {bookings.map((b) => {
              const facName = (b as any).facility?.name ?? "—";
              const pkgName = (b as any).package?.name ?? "—";
              
              // Highlight if expiring within 7 days
              const daysUntilExpiry = Math.ceil((new Date(b.end_date!).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              const isExpiringSoon = daysUntilExpiry <= 7;

              return (
                <tr key={b.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-stone-900 flex items-center gap-1.5">
                      {b.customer_name}
                      {b.is_resident && (
                        <div title="Resident">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">{b.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-stone-700">{facName}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{pkgName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-stone-900">{formatINR(b.total_amount)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isExpiringSoon ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      <Calendar className="w-3 h-3" />
                      {formatDisplayDate(b.end_date!)}
                    </div>
                    {isExpiringSoon && (
                      <div className="text-[10px] text-amber-600 font-semibold mt-1 uppercase tracking-wider">
                        Expiring in {daysUntilExpiry} days!
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 h-8">
                      <a href={`https://wa.me/91${b.customer_phone.replace(/\D/g, "")}?text=Hi ${encodeURIComponent(b.customer_name)}, your booking for ${encodeURIComponent(facName)} expires on ${formatDisplayDate(b.end_date!)}. Please let us know if you would like to renew.`} target="_blank" rel="noreferrer">
                        <RefreshCw className="w-3 h-3" /> Remind
                      </a>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ActiveBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
          Active Bookings <span className="text-sm font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">(Current & Upcoming)</span>
        </h1>
        <p className="text-sm text-stone-500 mt-1">Track all active packages and send renewal reminders for expiring bookings.</p>
      </div>
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-stone-400">Loading active bookings...</div>}>
        <ActiveBookingsList />
      </Suspense>
    </div>
  );
}
