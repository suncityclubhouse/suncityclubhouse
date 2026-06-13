import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export default function BookingPageLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <nav className="flex items-center gap-1.5 text-sm text-stone-300 mb-8">
        <span className="w-10 h-4 bg-stone-200 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        <span className="w-20 h-4 bg-stone-200 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        <span className="w-10 h-4 bg-stone-200 rounded" />
      </nav>

      {/* Title Header Skeleton */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-2/3 bg-stone-200" />
        <Skeleton className="h-4 w-1/2 bg-stone-200" />
      </div>

      {/* Stepper Skeleton */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-stone-200 border-2 border-stone-200" />
              <div className="h-3 w-12 bg-stone-200 rounded mt-2 hidden sm:block" />
            </div>
            {i < 3 && <div className="h-[2px] w-10 sm:w-16 mx-1 bg-stone-200" />}
          </div>
        ))}
      </div>

      {/* Package Selection Skeleton */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-stone-200" />
            <Skeleton className="h-4 w-24 bg-stone-200" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36 bg-stone-200 rounded-lg" />
          </div>
        </div>

        {/* Hourly slots grid skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20 bg-stone-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-24 bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
              <Skeleton className="h-5 w-1/2 bg-stone-200" />
              <Skeleton className="h-4 w-1/3 bg-stone-200" />
            </div>
            <div className="h-24 bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
              <Skeleton className="h-5 w-1/2 bg-stone-200" />
              <Skeleton className="h-4 w-1/3 bg-stone-200" />
            </div>
          </div>
        </div>

        {/* Calendar slots grid placeholder */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-5 w-32 bg-stone-200" />
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full bg-stone-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
