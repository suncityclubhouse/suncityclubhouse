"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createBooking } from "@/actions/bookings";
import { toDateString } from "@/lib/utils/dates";
import { bookingFormSchema, type BookingFormSchema } from "@/lib/validations/booking";
import type { FacilityWithMedia } from "@/types/database";
import type { BookingWizardState } from "@/types";

interface StepBookingFormProps {
  facility: FacilityWithMedia;
  state: BookingWizardState;
  onStateChange: (patch: Partial<BookingWizardState>) => void;
  onNext: (result: { bookingId: string; bookingRef: string; expiresAt: string }) => void;
  onBack: () => void;
}

export function StepBookingForm({ facility, state, onStateChange, onNext, onBack }: StepBookingFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BookingFormSchema>({
    resolver: zodResolver(bookingFormSchema) as any,
    defaultValues: {
      isResident: true,
    },
  });

  const isResident = form.watch("isResident");

  const onSubmit = async (values: BookingFormSchema) => {
    if (!state.selectedDate || !state.selectedPackageId || !state.sessionToken || !state.slotType) {
      toast.error("Missing booking details. Please go back and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBooking({
        facilityId: facility.id,
        packageId: state.selectedPackageId,
        sessionToken: state.sessionToken,
        slotType: state.slotType,
        bookingDate: toDateString(state.selectedDate),
        startTime: state.startTime ?? undefined,
        endTime: state.endTime ?? undefined,
        endDate: state.endDate ?? undefined,
        baseAmount: state.totalAmount,
        totalAmount: state.totalAmount,
        formValues: {
          ...values,
          eventPurpose: values.eventPurpose || "Sports Booking",
        },
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to create booking");
        return;
      }

      onNext(result.data!);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Your Details</h2>
        <p className="text-sm text-stone-500 mt-1">Fill in your information to complete the booking</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Personal info */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Personal Info</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                placeholder="Your full name"
                {...form.register("customerName")}
                aria-invalid={!!form.formState.errors.customerName}
              />
              {form.formState.errors.customerName && (
                <p className="text-xs text-red-500">{form.formState.errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customerPhone">Mobile Number *</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="10-digit mobile number"
                {...form.register("customerPhone")}
                aria-invalid={!!form.formState.errors.customerPhone}
              />
              {form.formState.errors.customerPhone && (
                <p className="text-xs text-red-500">{form.formState.errors.customerPhone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerEmail">Email Address *</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="you@example.com"
              {...form.register("customerEmail")}
              aria-invalid={!!form.formState.errors.customerEmail}
            />
            {form.formState.errors.customerEmail && (
              <p className="text-xs text-red-500">{form.formState.errors.customerEmail.message}</p>
            )}
          </div>
        </div>

        {/* Resident info */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Residency</h3>

          <div className="flex items-center gap-3">
            <Switch
              id="isResident"
              checked={isResident}
              onCheckedChange={(v) => form.setValue("isResident", v)}
            />
            <Label htmlFor="isResident" className="cursor-pointer">
              {isResident ? "I am a resident" : "I am an outsider / guest"}
            </Label>
          </div>

          {isResident && (
            <div className="space-y-1.5">
              <Label htmlFor="houseNumber">House / Flat Number *</Label>
              <Input
                id="houseNumber"
                placeholder="e.g. A-101, Block B Floor 3"
                {...form.register("houseNumber")}
                aria-invalid={!!form.formState.errors.houseNumber}
              />
              {form.formState.errors.houseNumber && (
                <p className="text-xs text-red-500">{form.formState.errors.houseNumber.message}</p>
              )}
            </div>
          )}

          {!isResident && (
            <div className="space-y-1.5">
              <Label htmlFor="referenceResident">Reference Resident Name (optional)</Label>
              <Input
                id="referenceResident"
                placeholder="Name of the resident who invited you"
                {...form.register("referenceResident")}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>← Back</Button>
          <Button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: "#8b6914" }}
            className="text-white hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating booking…</> : "Proceed to Payment →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
