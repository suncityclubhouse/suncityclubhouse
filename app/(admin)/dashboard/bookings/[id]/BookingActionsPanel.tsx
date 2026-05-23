"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, XCircle, Ban, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateBookingStatus } from "@/actions/bookings";
import {
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
} from "@/lib/resend";
import type { Booking } from "@/types/database";

interface BookingActionsPanelProps {
  booking: Booking & { facility?: { name: string } };
}

export function BookingActionsPanel({ booking }: BookingActionsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const canApprove = booking.status === "pending_approval";
  const canReject = booking.status === "pending_approval";
  const canCancel = ["awaiting_payment", "pending_approval", "confirmed"].includes(booking.status);
  const canComplete = booking.status === "confirmed";

  const perform = async (
    status: "confirmed" | "rejected" | "cancelled" | "completed",
    rejectionReason?: string
  ) => {
    setLoading(true);
    try {
      const res = await updateBookingStatus({ bookingId: booking.id, status, rejectionReason });
      if (!res.success) {
        toast.error(res.error ?? "Failed to update");
        return;
      }

      // Send email notifications
      if (status === "confirmed") {
        await sendBookingConfirmedEmail({
          to: booking.customer_email,
          name: booking.customer_name,
          bookingRef: booking.booking_ref,
          facilityName: booking.facility?.name ?? "Facility",
          bookingDate: booking.booking_date,
          startTime: booking.start_time ?? undefined,
          endTime: booking.end_time ?? undefined,
        }).catch(() => {});
      }
      if (status === "rejected") {
        await sendBookingRejectedEmail({
          to: booking.customer_email,
          name: booking.customer_name,
          bookingRef: booking.booking_ref,
          facilityName: booking.facility?.name ?? "Facility",
          reason: rejectionReason,
        }).catch(() => {});
      }

      toast.success(`Booking ${status}`);
      setRejectOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canApprove && (
        <Button
          onClick={() => perform("confirmed")}
          disabled={loading}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Approve & Confirm
        </Button>
      )}
      {canReject && (
        <Button
          variant="destructive"
          onClick={() => setRejectOpen(true)}
          disabled={loading}
          className="gap-2"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </Button>
      )}
      {canCancel && !canApprove && (
        <Button
          variant="outline"
          onClick={() => perform("cancelled")}
          disabled={loading}
          className="gap-2 text-stone-600"
        >
          <Ban className="w-4 h-4" />
          Cancel
        </Button>
      )}
      {canComplete && (
        <Button
          variant="outline"
          onClick={() => perform("completed")}
          disabled={loading}
          className="gap-2 text-violet-700 border-violet-200 hover:bg-violet-50"
        >
          <CheckCheck className="w-4 h-4" />
          Mark Completed
        </Button>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-stone-500">This reason will be emailed to the customer:</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment amount mismatch…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectReason.length < 10 || loading}
              onClick={() => perform("rejected", rejectReason)}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
