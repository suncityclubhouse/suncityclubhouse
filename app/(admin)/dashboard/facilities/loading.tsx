import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FacilitiesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <div>
          <div className="h-8 w-32 bg-stone-200 rounded" />
          <div className="h-4 w-40 bg-stone-200 rounded mt-2" />
        </div>
        <Button disabled style={{ backgroundColor: "#08428C" }} className="text-white gap-2 opacity-50 pointer-events-none">
          <Plus className="w-4 h-4" />
          Add Facility
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="h-40 bg-stone-100 animate-pulse" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-2/3 bg-stone-200" />
              <Skeleton className="h-4 w-1/3 bg-stone-200" />
              <Skeleton className="h-4 w-full bg-stone-200" />
              <Skeleton className="h-9 w-full bg-stone-200 rounded-lg mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
