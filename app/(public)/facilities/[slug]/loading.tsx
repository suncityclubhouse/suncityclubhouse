import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export default function FacilityDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-300 mb-6">
        <span className="w-10 h-4 bg-slate-200 rounded" />
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="w-16 h-4 bg-slate-200 rounded" />
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="w-24 h-4 bg-slate-200 rounded" />
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — gallery + details */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
          {/* Gallery Skeleton */}
          <div className="w-full aspect-video bg-slate-200 rounded-2xl" />

          {/* Mobile CTA Skeleton */}
          <div className="block lg:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3 bg-slate-200" />
            </div>
            <Skeleton className="h-12 w-full bg-slate-200 rounded-xl" />
            <Skeleton className="h-3 w-1/2 mx-auto bg-slate-200" />
          </div>

          {/* Facility Info Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24 bg-slate-200 rounded-full" />
              <Skeleton className="h-10 w-2/3 bg-slate-200 rounded-lg" />
            </div>

            {/* Meta skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-28 bg-slate-200" />
            </div>

            <div className="h-[1px] bg-slate-200 w-full my-6" />

            {/* Description Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-36 bg-slate-200" />
              <Skeleton className="h-4 w-full bg-slate-200" />
              <Skeleton className="h-4 w-full bg-slate-200" />
              <Skeleton className="h-4 w-5/6 bg-slate-200" />
            </div>

            {/* Rules Skeleton */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <Skeleton className="h-6 w-32 bg-slate-200" />
              <Skeleton className="h-4 w-full bg-slate-200" />
              <Skeleton className="h-4 w-4/5 bg-slate-200" />
            </div>
          </div>
        </div>

        {/* Right column — sticky booking CTA (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2 bg-slate-200" />
            </div>
            <Skeleton className="h-12 w-full bg-slate-200 rounded-xl" />
            <Skeleton className="h-3 w-2/3 mx-auto bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
