import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
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
        .in("status", ["confirmed", "completed"])
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
    .not("status", "in", "(rejected,cancelled,expired)");

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

  // Fetch Expenses
  const d = new Date();
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  const { data: allExpensesData } = await db.from("expenses").select("amount, expense_date").eq("society_id", process.env.NEXT_PUBLIC_SOCIETY_ID!);
  
  const totalExpenses = (allExpensesData ?? []).reduce((acc, ex) => acc + Number(ex.amount), 0);
  const monthlyExpenses = (allExpensesData ?? [])
    .filter(ex => ex.expense_date >= startOfMonth)
    .reduce((acc, ex) => acc + Number(ex.amount), 0);

  const netProfit = kpis.totalRevenue - totalExpenses;
  const netProfitMonthly = kpis.monthlyRevenue - monthlyExpenses;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/revenue" className="block col-span-1 group">
          <KPICard
            title="Total Revenue"
            value={kpis.totalRevenue}
            isCurrency
            icon={DollarSign}
            className="h-full group-hover:shadow-md group-hover:border-blue-200 transition-all cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/expenses" className="block group">
          <KPICard
            title="Total Expenses"
            value={totalExpenses}
            isCurrency
            icon={BookOpen}
            accentColor="#ef4444"
            className="h-full group-hover:shadow-md group-hover:border-red-200 transition-all cursor-pointer"
          />
        </Link>
        <div className="block group">
          <KPICard
            title="Net Profit"
            value={netProfit}
            isCurrency
            icon={TrendingUp}
            accentColor={netProfit >= 0 ? "#16a34a" : "#ef4444"}
            className="h-full group-hover:shadow-md transition-all cursor-default"
          />
        </div>
        <Link href="/dashboard/revenue" className="block group">
          <KPICard
            title="Monthly Revenue"
            value={kpis.monthlyRevenue}
            isCurrency
            icon={TrendingUp}
            accentColor="#16a34a"
            className="h-full group-hover:shadow-md group-hover:border-green-200 transition-all cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/bookings" className="block group">
          <KPICard
            title="Total Bookings"
            value={kpis.totalBookings}
            icon={BookOpen}
            accentColor="#3b82f6"
            className="h-full group-hover:shadow-md group-hover:border-blue-200 transition-all cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/bookings?status=pending_approval" className="block group">
          <KPICard
            title="Pending Approvals"
            value={kpis.pendingApprovals}
            icon={Clock}
            accentColor="#f59e0b"
            className="h-full group-hover:shadow-md group-hover:border-amber-200 transition-all cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/bookings?status=confirmed" className="block group">
          <KPICard
            title="Upcoming Bookings"
            value={kpis.upcomingBookings}
            icon={CalendarCheck}
            accentColor="#8b5cf6"
            className="h-full group-hover:shadow-md group-hover:border-purple-200 transition-all cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/facilities" className="block group">
          <KPICard
            title="Most Booked"
            value={kpis.mostBookedFacility ?? "—"}
            icon={Star}
            accentColor="#ec4899"
            className="h-full group-hover:shadow-md group-hover:border-pink-200 transition-all cursor-pointer"
          />
        </Link>
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
            <Link href="/dashboard/bookings?status=pending_approval" className="text-xs text-amber-700 hover:underline">
              View all
            </Link>
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
                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="text-xs text-amber-700 font-medium hover:underline flex-shrink-0 ml-3"
                  >
                    Review →
                  </Link>
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
          <Link href="/dashboard/bookings?status=confirmed" className="text-xs text-blue-700 hover:underline">
            View all
          </Link>
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
