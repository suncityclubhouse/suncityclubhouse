import { Skeleton } from "@/components/ui/skeleton";

export default function RevenueLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title block */}
      <div className="mb-6">
        <div className="h-8 w-28 bg-stone-200 rounded" />
        <div className="h-4 w-72 bg-stone-200 rounded mt-2" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-4 w-28 bg-stone-200" />
            <Skeleton className="h-8 w-24 bg-stone-200" />
            {i === 1 && <Skeleton className="h-4 w-32 bg-stone-100" />}
          </div>
        ))}
      </div>

      {/* 12-month chart card skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <Skeleton className="h-6 w-40 bg-stone-200" />
        <div className="h-[300px] w-full bg-stone-50 rounded-lg flex items-end p-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 bg-stone-200 rounded-t"
              style={{ height: `${20 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>

      {/* Revenue by Facility Table skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <Skeleton className="h-6 w-36 bg-stone-200" />
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-stone-200">
            <Skeleton className="h-5 w-24 bg-stone-200" />
            <Skeleton className="h-5 w-16 bg-stone-200" />
            <Skeleton className="h-5 w-20 bg-stone-200" />
            <Skeleton className="h-5 w-12 bg-stone-200" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-3 border-b border-stone-100 last:border-0">
              <Skeleton className="h-4 w-32 bg-stone-200" />
              <Skeleton className="h-4 w-12 bg-stone-200 text-right" />
              <Skeleton className="h-4 w-20 bg-stone-200 text-right" />
              <Skeleton className="h-4 w-12 bg-stone-200 text-right" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
