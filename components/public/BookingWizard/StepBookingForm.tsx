"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/actions/bookings";
import { sendOtp, verifyOtp, resendOtp } from "@/actions/otp";
import { toDateString } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/formatters";
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
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const form = useForm<BookingFormSchema>({
    resolver: zodResolver(bookingFormSchema) as any,
    defaultValues: {
      isResident: state.isResident ?? true,
    },
  });

  const isResident = form.watch("isResident");
  const phone = form.watch("customerPhone");

  // Determine pricing logic
  const pkg = facility.facility_packages.find((p) => p.id === state.selectedPackageId);
  const hasResidentDiscount = pkg ? (pkg.resident_price !== null && pkg.resident_price < pkg.price) : false;
  const needsVerification = hasResidentDiscount && isResident;
  
  const canProceed = !needsVerification || otpVerified;

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number first.");
      form.trigger("customerPhone");
      return;
    }
    
    setSendingOtp(true);
    const res = await sendOtp(phone);
    setSendingOtp(false);
    
    if (res.success) {
      setOtpSent(true);
      toast.success("OTP sent to your mobile.");
    } else {
      toast.error(res.error);
    }
  };

  const handleResendOtp = async () => {
    setSendingOtp(true);
    const res = await resendOtp(phone);
    setSendingOtp(false);
    
    if (res.success) {
      toast.success("OTP resent.");
    } else {
      toast.error(res.error);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) {
      toast.error("Please enter the OTP.");
      return;
    }
    
    setVerifyingOtp(true);
    const res = await verifyOtp(phone, otpValue);
    setVerifyingOtp(false);
    
    if (res.success) {
      setOtpVerified(true);
      toast.success("Mobile number verified!");
    } else {
      toast.error(res.error);
    }
  };

  const onSubmit = async (values: BookingFormSchema) => {
    if (!state.selectedDate || !state.selectedPackageId || !state.sessionToken || !state.slotType) {
      toast.error("Missing booking details. Please go back and try again.");
      return;
    }

    if (needsVerification && !otpVerified) {
      toast.error("Please verify your mobile number to get the resident discount.");
      return;
    }

    // Recalculate amount if resident discount applies.
    // quantity = how many units (hours or days) in the booking, derived from the wizard's stored totalAmount.
    let finalAmount = state.totalAmount;
    if (needsVerification && pkg && pkg.resident_price !== null && pkg.price > 0) {
      const quantity = Math.round(state.totalAmount / pkg.price);
      finalAmount = quantity * pkg.resident_price;
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
        baseAmount: finalAmount,
        totalAmount: finalAmount,
        formValues: {
          ...values,
          eventPurpose: values.eventPurpose || "Facility Booking",
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
                disabled={otpVerified}
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
                disabled={otpVerified}
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
              disabled={otpVerified}
            />
            {form.formState.errors.customerEmail && (
              <p className="text-xs text-red-500">{form.formState.errors.customerEmail.message}</p>
            )}
          </div>
        </div>

        {/* Resident info */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Residency</h3>

          <div className="flex items-center gap-3 pb-2">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isResident ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <span className="text-sm font-medium text-stone-700">
              {isResident ? "Resident booking" : "Non-Resident booking"}
            </span>
            {hasResidentDiscount && isResident && (
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Discount Applied
              </span>
            )}
          </div>

          {isResident && (
            <div className="space-y-1.5">
              <Label htmlFor="houseNumber">House / Flat Number *</Label>
              <Input
                id="houseNumber"
                placeholder="e.g. A-101, Block B Floor 3"
                {...form.register("houseNumber")}
                aria-invalid={!!form.formState.errors.houseNumber}
                disabled={otpVerified}
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
          
          {/* OTP Verification Section */}
          {needsVerification && (
            <div className="pt-3 mt-3 border-t border-stone-100">
              {otpVerified ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Resident verification successful. Pricing updated!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-stone-600">
                    To claim the resident discount ({formatINR(pkg!.resident_price!)}), please verify your mobile number.
                  </p>
                  
                  {!otpSent ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !phone || phone.length !== 10}
                      className="w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      {sendingOtp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Send OTP via SMS
                    </Button>
                  ) : (
                    <div className="flex items-end gap-3 max-w-sm">
                      <div className="space-y-1.5 flex-1">
                        <Label htmlFor="otp">Enter 6-digit OTP</Label>
                        <Input
                          id="otp"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          placeholder="------"
                          maxLength={6}
                          className="text-center tracking-widest text-lg"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpValue.length < 4}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {verifyingOtp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Verify"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleResendOtp}
                        disabled={sendingOtp}
                        title="Resend OTP"
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <RefreshCw className={`w-4 h-4 ${sendingOtp ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" type="button" onClick={onBack}>← Back</Button>
          <Button
            type="submit"
            disabled={submitting || !canProceed}
            style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
            className="text-white hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating booking…</> : "Proceed to Payment →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
