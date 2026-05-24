import type { Metadata } from "next";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { KPICard } from "@/components/admin/KPICard";
import { DollarSign, TrendingUp, Building2 } from "lucide-react";
import { formatINR } from "@/lib/utils/formatters";

export const metadata: Metadata = { title: "Revenue | Admin" };

async function RevenueContent() {
  const db = createAdminClient();

  // Last 12 months revenue — confirmed + completed both count as earned revenue
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return {
      month: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
      startDate: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0],
    };
  });

  const revenueTrend = await Promise.all(
    months.map(async ({ month, startDate, endDate }) => {
      const { data, error } = await db
        .from("bookings")
        .select("total_amount")
        .in("status", ["confirmed", "completed"])
        .gte("booking_date", startDate)
        .lte("booking_date", endDate);
      if (error) console.error("[Revenue] trend query:", error);
      // Number() required — Supabase returns NUMERIC columns as strings
      const revenue = (data ?? []).reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
      return { month, revenue };
    })
  );

  // Per-facility revenue — confirmed + completed
  const { data: bookings, error: facError } = await db
    .from("bookings")
    .select("total_amount, facility_id, facilities(name)")
    .in("status", ["confirmed", "completed"]);

  if (facError) console.error("[Revenue] facility query:", facError);

  const facilityRevenue: Record<string, { name: string; revenue: number; bookings: number }> = {};
  for (const b of bookings ?? []) {
    const fid = b.facility_id;
    if (!facilityRevenue[fid]) {
      facilityRevenue[fid] = { name: (b as any).facilities?.name ?? fid, revenue: 0, bookings: 0 };
    }
    // Number() to avoid NUMERIC string concatenation bug
    facilityRevenue[fid].revenue += Number(b.total_amount ?? 0);
    facilityRevenue[fid].bookings++;
  }

  const facilityList = Object.values(facilityRevenue).sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = facilityList.reduce((s, f) => s + f.revenue, 0);
  const thisMonthRevenue = revenueTrend[revenueTrend.length - 1]?.revenue ?? 0;
  const lastMonthRevenue = revenueTrend[revenueTrend.length - 2]?.revenue ?? 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Revenue"
          value={totalRevenue}
          isCurrency
          icon={DollarSign}
        />
        <KPICard
          title="This Month"
          value={thisMonthRevenue}
          isCurrency
          icon={TrendingUp}
          accentColor="#16a34a"
          trend={
            lastMonthRevenue > 0
              ? {
                  value: Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100),
                  label: "vs last month",
                }
              : undefined
          }
        />
        <KPICard
          title="Facilities Earning"
          value={facilityList.length}
          icon={Building2}
          accentColor="#8b5cf6"
        />
      </div>

      {/* 12-month chart */}
      <RevenueChart data={revenueTrend} />

      {/* Per-facility breakdown table */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h3 className="font-medium text-stone-900 mb-4">Revenue by Facility</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Facility</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Bookings</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Revenue</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {facilityList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400">
                    No revenue data yet
                  </td>
                </tr>
              ) : (
                facilityList.map((f) => (
                  <tr key={f.name} className="hover:bg-stone-50">
                    <td className="py-3 px-3 font-medium text-stone-900">{f.name}</td>
                    <td className="py-3 px-3 text-right text-stone-600">{f.bookings}</td>
                    <td className="py-3 px-3 text-right font-semibold text-stone-900">{formatINR(f.revenue)}</td>
                    <td className="py-3 px-3 text-right text-stone-500">
                      {totalRevenue > 0 ? `${Math.round((f.revenue / totalRevenue) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RevenuePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Revenue</h1>
        <p className="text-sm text-stone-500 mt-1">12-month revenue trend and facility breakdown</p>
      </div>
      <Suspense fallback={<div className="text-stone-400 text-sm">Loading revenue data…</div>}>
        <RevenueContent />
      </Suspense>
    </div>
  );
}
