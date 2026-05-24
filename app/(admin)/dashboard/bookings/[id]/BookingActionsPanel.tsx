"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, XCircle, Ban, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateBookingStatus } from "@/actions/bookings";
import type { Booking } from "@/types/database";

interface BookingActionsPanelProps {
  booking: Booking & { facility?: { name: string } };
}

export function BookingActionsPanel({ booking }: BookingActionsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const canApprove = booking.status === "pending_approval";
  const canReject = booking.status === "pending_approval";
  // Admin can cancel at any stage before it's completed/rejected/expired
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

      const messages: Record<string, string> = {
        confirmed: "✅ Booking approved — confirmation email sent to customer",
        rejected: "❌ Booking rejected — customer has been notified by email",
        cancelled: "Booking cancelled",
        completed: "✓ Booking marked as completed",
      };
      toast.success(messages[status] ?? `Booking ${status}`);
      setRejectOpen(false);
      setCancelOpen(false);
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
      {canComplete && (
        <Button
          variant="outline"
          onClick={() => perform("completed")}
          disabled={loading}
          className="gap-2 text-violet-700 border-violet-200 hover:bg-violet-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
          Mark Completed
        </Button>
      )}
      {canCancel && (
        <Button
          variant="outline"
          onClick={() => setCancelOpen(true)}
          disabled={loading}
          className="gap-2 text-stone-600 hover:bg-stone-50"
        >
          <Ban className="w-4 h-4" />
          Cancel Booking
        </Button>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-stone-500">
              This reason will be emailed to <strong>{booking.customer_name}</strong>:
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment amount mismatch, UTR not found…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Back</Button>
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

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-stone-600">
              Are you sure you want to cancel booking <strong>{booking.booking_ref}</strong> for{" "}
              <strong>{booking.customer_name}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => perform("cancelled")}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
