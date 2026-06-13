import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title block */}
      <div className="mb-6">
        <div className="h-8 w-28 bg-stone-200 rounded" />
        <div className="h-4 w-44 bg-stone-200 rounded mt-2" />
      </div>

      {/* Calendar box skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        {/* Month header skeleton */}
        <div className="text-center mb-6 flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-32 bg-stone-200" />
          <Skeleton className="h-4 w-40 bg-stone-100" />
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center py-1">
              <Skeleton className="h-4 w-8 mx-auto bg-stone-200" />
            </div>
          ))}
        </div>

        {/* Calendar grid skeleton */}
        <div className="grid grid-cols-7 gap-px bg-stone-100 border border-stone-100 rounded-lg overflow-hidden">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-white min-h-[90px] p-2 space-y-2">
              <Skeleton className="h-5 w-5 bg-stone-200 rounded-full" />
              {i % 4 === 0 && <Skeleton className="h-4 w-full bg-stone-100 rounded" />}
              {i % 5 === 0 && <Skeleton className="h-4 w-[80%] bg-stone-50 rounded" />}
            </div>
          ))}
        </div>

        {/* Legend skeleton */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24 bg-stone-200 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
