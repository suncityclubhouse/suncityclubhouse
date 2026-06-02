"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { StepSlotSelect } from "./StepSlotSelect";
import { StepBookingForm } from "./StepBookingForm";
import { StepPayment } from "./StepPayment";
import { StepConfirmation } from "./StepConfirmation";
import { releaseTemporaryReservation } from "@/actions/reservations";
import type { FacilityWithMedia } from "@/types/database";
import type { BookingWizardState } from "@/types";
import { cn } from "@/lib/utils/formatters";

const STEPS = [
  { num: 1, label: "Package" },
  { num: 2, label: "Details" },
  { num: 3, label: "Payment" },
  { num: 4, label: "Done" },
];

interface BookingWizardProps {
  facility: FacilityWithMedia;
}

export function BookingWizard({ facility }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<BookingWizardState>({
    facilityId: facility.id,
    facilitySlug: facility.slug,
    selectedDate: new Date(),
    selectedPackageId: null,
    slotType: null,
    startTime: null,
    endTime: null,
    totalAmount: 0,
    sessionToken: null,
    reservationExpiresAt: null,
  });
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    bookingRef: string;
    expiresAt: string;
  } | null>(null);

  const updateState = useCallback((patch: Partial<BookingWizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Release reservation if user navigates back past step 2
  const handleBack = async () => {
    if (step === 2 && state.sessionToken) {
      await releaseTemporaryReservation(state.sessionToken);
      updateState({ sessionToken: null, reservationExpiresAt: null });
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const goNext = () => setStep((s) => Math.min(4, s + 1));

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      {step < 4 && (
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                    step === s.num
                      ? "border-amber-600 bg-amber-600 text-white"
                      : step > s.num
                      ? "border-amber-600 bg-amber-50 text-amber-700"
                      : "border-stone-300 bg-white text-stone-400"
                  )}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-medium hidden sm:block",
                    step === s.num ? "text-amber-700" : "text-stone-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-10 sm:w-16 mx-1 transition-all",
                    step > s.num ? "bg-amber-600" : "bg-stone-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div>
        {step === 1 && (
          <StepSlotSelect
            facility={facility}
            state={state}
            onStateChange={updateState}
            onNext={goNext}
            onBack={handleBack}
          />
        )}
        {step === 2 && (
          <StepBookingForm
            facility={facility}
            state={state}
            onStateChange={updateState}
            onNext={(result) => {
              setBookingResult(result);
              goNext();
            }}
            onBack={handleBack}
          />
        )}
        {step === 3 && bookingResult && (
          <StepPayment
            bookingId={bookingResult.bookingId}
            bookingRef={bookingResult.bookingRef}
            expiresAt={bookingResult.expiresAt}
            totalAmount={state.totalAmount}
            onSuccess={goNext}
          />
        )}
        {step === 4 && bookingResult && (
          <StepConfirmation
            bookingRef={bookingResult.bookingRef}
            facilityName={facility.name}
          />
        )}
      </div>
    </div>
  );
}
