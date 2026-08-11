"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { blockDates } from "@/actions/facilities";
import { toast } from "sonner";
import { CalendarOff } from "lucide-react";

export function BlockDatesModal({
  facilities,
  adminId,
}: {
  facilities: { id: string; name: string }[];
  adminId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const facilityId = formData.get("facilityId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;

    const res = await blockDates({
      facilityId: facilityId === "all" ? undefined : facilityId,
      startDate,
      endDate,
      reason,
      adminId,
    });

    if (res.success) {
      toast.success("Dates blocked successfully");
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to block dates");
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 gap-2">
        <CalendarOff className="w-4 h-4" />
        Block Dates
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Block Dates</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Facility</label>
            <select
              name="facilityId"
              required
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">End Date</label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Reason / Note</label>
            <input
              type="text"
              name="reason"
              placeholder="e.g. Deep Cleaning, Maintenance"
              required
              minLength={3}
              maxLength={200}
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? "Blocking..." : "Block Dates"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
