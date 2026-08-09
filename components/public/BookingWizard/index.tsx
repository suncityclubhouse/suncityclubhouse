"use client";

import { useState, useCallback } from "react";
import { Home, UserRound } from "lucide-react";
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
  // null = not chosen yet → shows the residency modal
  const [residentChosen, setResidentChosen] = useState<boolean | null>(null);

  const [state, setState] = useState<BookingWizardState>({
    facilityId: facility.id,
    facilitySlug: facility.slug,
    selectedDate: new Date(),
    selectedPackageId: null,
    slotType: null,
    startTime: null,
    endTime: null,
    endDate: null,
    quantity: 1,
    baseAmount: 0,
    totalAmount: 0,
    gstPercentage: 0,
    isGstInclusive: true,
    cgstAmount: 0,
    sgstAmount: 0,
    isResident: true,
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

  const handleResidencyChoice = (choice: boolean) => {
    setResidentChosen(choice);
    updateState({ isResident: choice });
  };

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

      {/* ─── Residency Modal — blocks UI until user picks ─── */}
      {residentChosen === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-serif font-bold text-slate-900 text-center">
                Are you a society resident?
              </h2>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">

              <button
                onClick={() => handleResidencyChoice(true)}
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-300 group-hover:bg-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Home className="w-5 h-5 text-emerald-700" />
                </div>
                <p className="font-semibold text-slate-800">Yes, I&apos;m a Resident</p>
              </button>

              <button
                onClick={() => handleResidencyChoice(false)}
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 group-hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <UserRound className="w-5 h-5 text-slate-600" />
                </div>
                <p className="font-semibold text-slate-800">No, I&apos;m a Non-Resident</p>
              </button>

            </div>

            <div className="pb-5" />
          </div>
        </div>
      )}

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
                      ? "border-blue-600 bg-blue-600 text-white"
                      : step > s.num
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-medium hidden sm:block",
                    step === s.num ? "text-blue-700" : "text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-10 sm:w-16 mx-1 transition-all",
                    step > s.num ? "bg-blue-600" : "bg-slate-200"
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
            baseAmount={state.baseAmount}
            gstPercentage={state.gstPercentage}
            isGstInclusive={state.isGstInclusive}
            cgstAmount={state.cgstAmount}
            sgstAmount={state.sgstAmount}
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
