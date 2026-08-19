import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getBookings } from "@/actions/bookings";
import { AdminBookingsTable } from "@/components/admin/BookingTable";
import { BookingTableSkeleton } from "@/components/shared/LoadingSkeleton";
import { BookingsActionBar } from "./BookingsActionBar";
import type { BookingStatus } from "@/types/database";


export const metadata: Metadata = { title: "Bookings | Admin" };

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    facilityId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

async function BookingsContent({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const pageSize = 20;

  const result = await getBookings({
    status: (searchParams.status as BookingStatus | "all") ?? "all",
    search: searchParams.search,
    facilityId: searchParams.facilityId,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    page,
    pageSize,
  });

  if (!result.success) {
    return <div className="text-red-500 text-sm">Failed to load bookings: {result.error}</div>;
  }

  return (
    <AdminBookingsTable
      bookings={result.data!.bookings}
      total={result.data!.total}
      page={page}
      pageSize={pageSize}
    />
  );
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Bookings</h1>
          <p className="text-sm text-stone-500 mt-1">Manage all booking requests</p>
        </div>
        <div className="flex items-center gap-2">
          <BookingsActionBar />
          <Link
            href="/dashboard/bookings/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
          >
            <Plus className="w-4 h-4" />
            New Booking
          </Link>
        </div>
      </div>
      <Suspense fallback={<BookingTableSkeleton />}>
        <BookingsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
