import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export default function BookingDetailLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      {/* Breadcrumb Skeleton */}
      <nav className="flex items-center gap-1.5 text-sm text-stone-300 mb-6">
        <span className="w-16 h-4 bg-stone-200 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        <span className="w-24 h-4 bg-stone-200 rounded" />
      </nav>

      {/* Header Skeleton */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-stone-200" />
          <Skeleton className="h-5 w-24 bg-stone-200 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-stone-200 rounded-lg" />
          <Skeleton className="h-9 w-24 bg-stone-200 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Customer info skeleton */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <Skeleton className="h-5 w-36 bg-stone-200" />
          <div className="h-px bg-stone-100" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 bg-stone-200" />
              <Skeleton className="h-4 w-32 bg-stone-200" />
            </div>
          ))}
        </div>

        {/* Booking details skeleton */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <Skeleton className="h-5 w-32 bg-stone-200" />
          <div className="h-px bg-stone-100" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 bg-stone-200" />
              <Skeleton className="h-4 w-32 bg-stone-200" />
            </div>
          ))}
        </div>

        {/* Payment info skeleton */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 lg:col-span-2">
          <Skeleton className="h-5 w-28 bg-stone-200" />
          <div className="h-px bg-stone-100" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24 bg-stone-200" />
            <Skeleton className="h-4 w-40 bg-stone-200" />
          </div>
          <div className="h-[220px] bg-stone-100 rounded-lg border border-stone-200" />
        </div>
      </div>
    </div>
  );
}
