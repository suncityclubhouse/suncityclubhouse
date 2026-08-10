"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Home, UserRound } from "lucide-react";
import { toast } from "sonner";
import { StepSlotSelect } from "./StepSlotSelect";
import { StepBookingForm } from "./StepBookingForm";
import { StepPayment } from "./StepPayment";
import { StepConfirmation } from "./StepConfirmation";
import { releaseTemporaryReservation } from "@/actions/reservations";
import type { FacilityWithMedia } from "@/types/database";
import type { BookingWizardState } from "@/types";
import { cn } from "@/lib/utils/formatters";

// ─── Session persistence types ────────────────────────────────────────────────

interface SavedAmounts {
  baseAmount: number;
  totalAmount: number;
  gstPercentage: number;
  isGstInclusive: boolean;
  cgstAmount: number;
  sgstAmount: number;
}

interface SavedSession {
  step: number;
  residentChosen: boolean;
  bookingResult: {
    bookingId: string;
    bookingRef: string;
    expiresAt: string;
  };
  amounts: SavedAmounts;
  uploadedProofUrl?: string;
  uploadedPublicId?: string;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function sessionKey(facilityId: string) {
  return `bw_v2_${facilityId}`;
}

/** Read and validate a saved session. Returns null if nothing valid is stored. */
function readSession(facilityId: string): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionKey(facilityId));
    if (!raw) return null;
    const parsed: SavedSession = JSON.parse(raw);
    // Must have a booking result and be on a valid step
    if (
      parsed?.bookingResult?.bookingId &&
      parsed?.bookingResult?.expiresAt &&
      parsed?.step >= 3 &&
      parsed?.amounts
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

function saveSession(facilityId: string, session: SavedSession) {
  try {
    sessionStorage.setItem(sessionKey(facilityId), JSON.stringify(session));
  } catch {}
}

function clearSession(facilityId: string) {
  try {
    sessionStorage.removeItem(sessionKey(facilityId));
  } catch {}
}

// ─── Wizard steps metadata ────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Package" },
  { num: 2, label: "Details" },
  { num: 3, label: "Payment" },
  { num: 4, label: "Done" },
];

interface BookingWizardProps {
  facility: FacilityWithMedia;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingWizard({ facility }: BookingWizardProps) {
  // Read session ONCE synchronously before any state initialisation.
  // Using a ref so this is stable across renders without re-running.
  const restoredSession = useRef<SavedSession | null>(
    readSession(facility.id)
  );
  const session = restoredSession.current;

  // ── State — all initialised from session in one place ──────────────────────

  const [step, setStep] = useState<number>(session?.step ?? 1);

  // null = not chosen yet → shows the residency modal
  const [residentChosen, setResidentChosen] = useState<boolean | null>(
    session ? session.residentChosen : null
  );

  const [state, setState] = useState<BookingWizardState>(() => ({
    facilityId: facility.id,
    facilitySlug: facility.slug,
    selectedDate: new Date(),
    selectedPackageId: null,
    slotType: null,
    startTime: null,
    endTime: null,
    endDate: null,
    quantity: 1,
    isResident: session?.residentChosen ?? true,
    sessionToken: null,
    reservationExpiresAt: null,
    // Amounts — restored from session if available, otherwise zero
    baseAmount: session?.amounts.baseAmount ?? 0,
    totalAmount: session?.amounts.totalAmount ?? 0,
    gstPercentage: session?.amounts.gstPercentage ?? 0,
    isGstInclusive: session?.amounts.isGstInclusive ?? true,
    cgstAmount: session?.amounts.cgstAmount ?? 0,
    sgstAmount: session?.amounts.sgstAmount ?? 0,
  }));

  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    bookingRef: string;
    expiresAt: string;
  } | null>(session?.bookingResult ?? null);

  // Restored upload state — StepPayment reads this via prop
  const [restoredUpload, setRestoredUpload] = useState<{
    url: string;
    publicId: string;
  } | null>(
    session?.uploadedProofUrl
      ? { url: session.uploadedProofUrl, publicId: session.uploadedPublicId ?? "" }
      : null
  );

  // ── Show resume toast once when session is restored ────────────────────────
  useEffect(() => {
    if (session) {
      toast.info("⚡ Your booking session has been restored.", {
        description: `Ref: ${session.bookingResult.bookingRef}`,
        duration: 4000,
      });
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save session to sessionStorage whenever payment-relevant state changes ──
  useEffect(() => {
    if (!bookingResult || step < 3) return;
    saveSession(facility.id, {
      step,
      residentChosen: residentChosen ?? true,
      bookingResult,
      amounts: {
        baseAmount: state.baseAmount,
        totalAmount: state.totalAmount,
        gstPercentage: state.gstPercentage,
        isGstInclusive: state.isGstInclusive,
        cgstAmount: state.cgstAmount,
        sgstAmount: state.sgstAmount,
      },
      uploadedProofUrl: restoredUpload?.url,
      uploadedPublicId: restoredUpload?.publicId,
    });
  }, [
    step,
    bookingResult,
    residentChosen,
    state.baseAmount,
    state.totalAmount,
    state.gstPercentage,
    state.isGstInclusive,
    state.cgstAmount,
    state.sgstAmount,
    restoredUpload,
    facility.id,
  ]);

  // ── Clear session when booking completes ───────────────────────────────────
  useEffect(() => {
    if (step === 4) {
      clearSession(facility.id);
    }
  }, [step, facility.id]);

  // ── Warn before tab close during active payment ────────────────────────────
  useEffect(() => {
    if (step !== 3) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own message; setting returnValue triggers the dialog
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step]);

  // ── Helpers ────────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

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
              <p className="text-sm text-stone-500 text-center mt-1">
                Residents may be eligible for a discounted rate.
              </p>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              <button
                onClick={() => handleResidencyChoice(true)}
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-300 group-hover:bg-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Home className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Yes, I&apos;m a Resident</p>
                  <p className="text-xs text-slate-500">I live in Suncity Society</p>
                </div>
              </button>

              <button
                onClick={() => handleResidencyChoice(false)}
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 group-hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <UserRound className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">No, I&apos;m a Guest / Non-Resident</p>
                  <p className="text-xs text-slate-500">Visiting or invited by a resident</p>
                </div>
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
            restoredUpload={restoredUpload}
            onUploadComplete={(url, publicId) => {
              // __clear__ is a sentinel value meaning the user removed the upload
              if (url === "__clear__") {
                setRestoredUpload(null);
              } else {
                setRestoredUpload({ url, publicId });
              }
            }}
            onSuccess={goNext}
          />
        )}
        {step === 3 && !bookingResult && (
          // Safety net: session was somehow cleared; avoid blank page
          <div className="text-center py-12 space-y-4">
            <p className="text-stone-500 text-sm">
              We couldn&apos;t restore your booking session. Please start a new booking.
            </p>
            <button
              onClick={() => { clearSession(facility.id); setStep(1); setResidentChosen(null); }}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              ← Start a new booking
            </button>
          </div>
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
