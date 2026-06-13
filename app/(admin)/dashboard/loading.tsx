import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DefaultDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-stone-200 rounded mt-2 animate-pulse" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}
