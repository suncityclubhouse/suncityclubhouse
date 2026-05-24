import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DollarSign,
  TrendingUp,
  BookOpen,
  Clock,
  CalendarCheck,
  Star,
} from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { RevenueChart, FacilityPieChart, BookingStatusChart } from "@/components/admin/RevenueChart";
import { UpcomingBookingsTable } from "@/components/admin/BookingTable";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardKPIs, getBookings } from "@/actions/bookings";

export const metadata: Metadata = { title: "Dashboard | Admin" };
export const revalidate = 60; // revalidate every minute

async function DashboardContent() {
  const db = createAdminClient();
  const kpis = await getDashboardKPIs();

  if (!kpis) return <div className="text-red-500">Failed to load dashboard data.</div>;

  // Revenue trend — last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleString("en-IN", { month: "short" }),
      startDate: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0],
    };
  });

  const revenueTrend = await Promise.all(
    months.map(async ({ month, startDate, endDate }) => {
      const { data } = await db
        .from("bookings")
        .select("total_amount")
        .eq("status", "confirmed")
        .gte("booking_date", startDate)
        .lte("booking_date", endDate);
      const revenue = (data ?? []).reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
      return { month, revenue };
    })
  );

  // Facility usage
  const { data: facilityData } = await db
    .from("bookings")
    .select("facility_id, facilities(name)")
    .not("status", "in", '("rejected","cancelled","expired")');

  const facilityCount: Record<string, { count: number; name: string }> = {};
  for (const b of facilityData ?? []) {
    const fid = b.facility_id;
    if (!facilityCount[fid]) facilityCount[fid] = { count: 0, name: (b as any).facilities?.name ?? fid };
    facilityCount[fid].count++;
  }

  const facilityUsage = Object.values(facilityCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((f, i) => ({ name: f.name, value: f.count, color: "" }));

  // Booking status distribution
  const { data: statusData } = await db
    .from("bookings")
    .select("status");

  const statusCount: Record<string, number> = {};
  for (const b of statusData ?? []) {
    statusCount[b.status] = (statusCount[b.status] ?? 0) + 1;
  }
  const statusDist = Object.entries(statusCount).map(([status, count]) => ({
    status: status as any,
    count,
  }));

  // Upcoming confirmed bookings
  const today = new Date().toISOString().split("T")[0];
  const { data: upcomingData } = await db
    .from("bookings")
    .select("*, facility:facilities(id,name,slug,thumbnail_url)")
    .eq("status", "confirmed")
    .gte("booking_date", today)
    .order("booking_date", { ascending: true })
    .limit(8);

  const upcoming = (upcomingData ?? []) as any[];

  // Pending approvals
  const { data: pendingData } = await db
    .from("bookings")
    .select("*, facility:facilities(id,name,slug,thumbnail_url)")
    .eq("status", "pending_approval")
    .order("payment_uploaded_at", { ascending: true })
    .limit(5);

  const pending = (pendingData ?? []) as any[];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          value={kpis.totalRevenue}
          isCurrency
          icon={DollarSign}
          className="col-span-1"
        />
        <KPICard
          title="Monthly Revenue"
          value={kpis.monthlyRevenue}
          isCurrency
          icon={TrendingUp}
          accentColor="#16a34a"
        />
        <KPICard
          title="Total Bookings"
          value={kpis.totalBookings}
          icon={BookOpen}
          accentColor="#3b82f6"
        />
        <KPICard
          title="Pending Approvals"
          value={kpis.pendingApprovals}
          icon={Clock}
          accentColor="#f59e0b"
        />
        <KPICard
          title="Upcoming Bookings"
          value={kpis.upcomingBookings}
          icon={CalendarCheck}
          accentColor="#8b5cf6"
        />
        <KPICard
          title="Most Booked"
          value={kpis.mostBookedFacility ?? "—"}
          icon={Star}
          accentColor="#ec4899"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueTrend} />
        </div>
        <FacilityPieChart data={facilityUsage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BookingStatusChart data={statusDist} />

        {/* Pending approvals queue */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-stone-900">Pending Approvals</h3>
            <a href="/dashboard/bookings?status=pending_approval" className="text-xs text-amber-700 hover:underline">
              View all
            </a>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-6 text-stone-400 text-sm">No pending approvals</div>
          ) : (
            <div className="space-y-3">
              {pending.map((b: any) => (
                <div key={b.id} className="flex items-start justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{b.customer_name}</p>
                    <p className="text-xs text-stone-500">{b.facility?.name} · {b.booking_date}</p>
                    <p className="text-xs font-mono text-stone-400">{b.booking_ref}</p>
                  </div>
                  <a
                    href={`/dashboard/bookings/${b.id}`}
                    className="text-xs text-amber-700 font-medium hover:underline flex-shrink-0 ml-3"
                  >
                    Review →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming bookings table */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-stone-900">Upcoming Bookings</h3>
          <a href="/dashboard/bookings?status=confirmed" className="text-xs text-amber-700 hover:underline">
            View all
          </a>
        </div>
        <UpcomingBookingsTable bookings={upcoming} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Operational overview and analytics</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
