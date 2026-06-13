import { BookingTableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-36 bg-stone-200 rounded" />
        <div className="h-4 w-52 bg-stone-200 rounded mt-2" />
      </div>
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <BookingTableSkeleton />
      </div>
    </div>
  );
}
