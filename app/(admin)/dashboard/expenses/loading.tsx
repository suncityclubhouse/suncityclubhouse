import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ExpensesLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Quick Add Banner Skeleton */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 space-y-3">
        <div className="h-5 w-48 bg-stone-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-lg p-3 space-y-3">
              <Skeleton className="h-5 w-24 bg-stone-200" />
              <Skeleton className="h-6 w-16 bg-stone-200" />
              <Skeleton className="h-8 w-full bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Header and Button Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-stone-200 rounded" />
        <Button disabled style={{ backgroundColor: "#8b6914" }} className="text-white opacity-50 pointer-events-none">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
        <div className="flex justify-between py-2 border-b border-stone-200">
          <Skeleton className="h-5 w-20 bg-stone-200" />
          <Skeleton className="h-5 w-28 bg-stone-200" />
          <Skeleton className="h-5 w-24 bg-stone-200" />
          <Skeleton className="h-5 w-32 bg-stone-200" />
          <Skeleton className="h-5 w-20 bg-stone-200" />
          <Skeleton className="h-5 w-16 bg-stone-200" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between py-3 border-b border-stone-100 last:border-0">
            <Skeleton className="h-4 w-20 bg-stone-200" />
            <Skeleton className="h-4 w-28 bg-stone-200" />
            <Skeleton className="h-4 w-24 bg-stone-200" />
            <Skeleton className="h-4 w-32 bg-stone-200" />
            <Skeleton className="h-4 w-20 bg-stone-200 text-right" />
            <Skeleton className="h-4 w-16 bg-stone-200 text-center" />
          </div>
        ))}
      </div>
    </div>
  );
}
