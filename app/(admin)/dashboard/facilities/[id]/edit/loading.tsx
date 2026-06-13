import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function EditFacilityLoading() {
  return (
    <div className="space-y-6 max-w-3xl animate-pulse">
      {/* Thumbnail Section Skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div className="h-5 w-36 bg-stone-200 rounded" />
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-40 h-28 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-10 w-32 bg-stone-200 rounded-lg" />
            <div className="h-3 w-48 bg-stone-200 rounded" />
          </div>
        </div>
      </div>

      {/* Basic Info Section Skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div className="h-5 w-36 bg-stone-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24 bg-stone-200" />
              <Skeleton className="h-10 w-full bg-stone-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Amenities Section Skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div className="h-5 w-40 bg-stone-200 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-full bg-stone-200 rounded-lg" />
          <Skeleton className="h-10 w-20 bg-stone-200 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 bg-stone-200 rounded-full" />
          ))}
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-3 justify-end">
        <Button disabled variant="outline">Cancel</Button>
        <Button disabled className="min-w-32 opacity-50" style={{ backgroundColor: "#8b6914" }}>
          Saving…
        </Button>
      </div>
    </div>
  );
}
