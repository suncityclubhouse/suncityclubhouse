"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Building2,
  IndianRupee,
  FileText,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdminBooking } from "@/actions/bookings";
import { formatINR } from "@/lib/utils/formatters";
import { calcGst } from "@/lib/utils/gst";
import type { FacilityWithMedia, FacilityPackage } from "@/types/database";

interface AdminBookingFormProps {
  facilities: FacilityWithMedia[];
}

const PAYMENT_TYPE_OPTIONS = [
  { value: "upi", label: "UPI / Bank Transfer (Already Paid)" },
  { value: "cash", label: "Cash Payment" },
  { value: "complimentary", label: "Complimentary (Free / Owner)" },
  { value: "deferred", label: "Deferred (Collect Later)" },
] as const;

type PaymentType = "upi" | "cash" | "complimentary" | "deferred";

export function AdminBookingForm({ facilities }: AdminBookingFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Facility & package
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [availablePackages, setAvailablePackages] = useState<FacilityPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<FacilityPackage | null>(null);

  // Slot
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isResident, setIsResident] = useState(true);
  const [houseNumber, setHouseNumber] = useState("");
  const [referenceResident, setReferenceResident] = useState("");
  const [eventPurpose, setEventPurpose] = useState("");
  const [guestCount, setGuestCount] = useState<string>("");

  // Booking config
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [bookingStatus, setBookingStatus] = useState<"confirmed" | "awaiting_payment">("confirmed");
  const [amountOverride, setAmountOverride] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  // When facility changes — update packages
  useEffect(() => {
    const facility = facilities.find((f) => f.id === selectedFacilityId);
    const pkgs = (facility?.facility_packages ?? []).filter((p) => p.is_active);
    setAvailablePackages(pkgs);
    setSelectedPackageId("");
    setSelectedPackage(null);
    setAmountOverride("");
  }, [selectedFacilityId, facilities]);

  // When package changes — update amount
  useEffect(() => {
    const pkg = availablePackages.find((p) => p.id === selectedPackageId);
    setSelectedPackage(pkg ?? null);
    if (pkg) {
      setAmountOverride(String(pkg.price));
      // Auto-fill times for fixed packages
      if (pkg.start_time) setStartTime(pkg.start_time.slice(0, 5));
      if (pkg.end_time) setEndTime(pkg.end_time.slice(0, 5));
    }
  }, [selectedPackageId, availablePackages]);

  // For complimentary — auto-set amount to 0
  useEffect(() => {
    if (paymentType === "complimentary") {
      setAmountOverride("0");
    }
  }, [paymentType]);

  const totalAmount = parseFloat(amountOverride || "0") * (selectedPackage?.type === "hourly" ? quantity : 1);
  const isHourly = selectedPackage?.type === "hourly";
  const isMultiDay = selectedPackage?.type === "monthly" || selectedPackage?.type === "quarterly" || selectedPackage?.type === "half_yearly" || selectedPackage?.type === "yearly";

  // Calculate GST
  const gstRate = selectedPackage?.gst_percentage ?? 0;
  const isGstInclusive = selectedPackage?.is_gst_inclusive ?? true;
  const gstBreakdown = calcGst(totalAmount, gstRate, isGstInclusive);

  const finalBaseAmount = gstBreakdown.baseAmount;
  const finalTotalAmount = gstBreakdown.grandTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFacilityId) { toast.error("Please select a facility."); return; }
    if (!selectedPackageId) { toast.error("Please select a package."); return; }
    if (!bookingDate) { toast.error("Please select a booking date."); return; }
    if (isHourly && (!startTime || !endTime)) { toast.error("Please enter start and end time."); return; }
    if (!customerName.trim()) { toast.error("Customer name is required."); return; }
    if (!customerPhone || customerPhone.length < 10) { toast.error("Please enter a valid 10-digit phone number."); return; }
    if (isResident && !houseNumber.trim()) { toast.error("Please enter the house/flat number for resident booking."); return; }

    setSubmitting(true);
    try {
      const result = await createAdminBooking({
        facilityId: selectedFacilityId,
        packageId: selectedPackageId,
        slotType: selectedPackage!.type,
        bookingDate,
        startTime: isHourly ? startTime : undefined,
        endTime: isHourly ? endTime : undefined,
        baseAmount: finalBaseAmount,
        totalAmount: finalTotalAmount,
        gstPercentage: gstRate,
        cgstAmount: gstBreakdown.cgstAmount,
        sgstAmount: gstBreakdown.sgstAmount,
        quantity: isHourly ? quantity : 1,
        paymentType,
        status: bookingStatus,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        isResident,
        houseNumber: isResident ? houseNumber.trim() : undefined,
        referenceResident: !isResident ? referenceResident.trim() || undefined : undefined,
        eventPurpose: eventPurpose.trim() || "Facility Booking",
        guestCount: guestCount ? parseInt(guestCount) : undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to create booking.");
        return;
      }

      toast.success(`Booking created! Ref: ${result.data!.bookingRef}`);
      router.push(`/dashboard/bookings/${result.data!.bookingId}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* ── Facility & Package ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Facility & Package
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Facility *</Label>
            <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility…" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Package / Slot Type *</Label>
            <Select
              value={selectedPackageId}
              onValueChange={setSelectedPackageId}
              disabled={!selectedFacilityId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedFacilityId ? "Select package…" : "Select facility first"} />
              </SelectTrigger>
              <SelectContent>
                {availablePackages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatINR(p.price)}
                    {p.type === "hourly" && " /hr"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Date & Time ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Date & Time
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Booking Date *</Label>
            <Input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>
          {isHourly && (
            <>
              <div className="space-y-1.5">
                <Label>Start Time *</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time *</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Number of Hours / Units</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </>
          )}
        </div>
        {isMultiDay && selectedPackage && (
          <p className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
            Multi-day booking — calculates end date automatically based on selected package type.
          </p>
        )}
      </div>

      {/* ── Customer Details ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4" /> Customer Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-9"
                placeholder="Customer's full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mobile Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-9"
                type="tel"
                placeholder="10-digit mobile"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Email Address <span className="text-stone-400 font-normal">(optional)</span></Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-9"
                type="email"
                placeholder="customer@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Guest Count (optional)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-9"
                type="number"
                min={1}
                placeholder="Number of guests"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Event Purpose</Label>
            <Input
              placeholder="Birthday party, Corporate event…"
              value={eventPurpose}
              onChange={(e) => setEventPurpose(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Residency ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <Home className="w-4 h-4" /> Residency
        </h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsResident(true)}
            className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
              isResident
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
            }`}
          >
            Resident
          </button>
          <button
            type="button"
            onClick={() => setIsResident(false)}
            className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
              !isResident
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
            }`}
          >
            Non-Resident / Guest
          </button>
        </div>
        {isResident ? (
          <div className="space-y-1.5">
            <Label>House / Flat Number *</Label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-9"
                placeholder="e.g. A-101, Block B Floor 3"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Reference Resident <span className="text-stone-400 font-normal">(optional)</span></Label>
            <Input
              placeholder="Name of referring resident"
              value={referenceResident}
              onChange={(e) => setReferenceResident(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Payment & Amount ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <IndianRupee className="w-4 h-4" /> Payment & Amount
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Payment Type *</Label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              Amount (₹)
              {isHourly ? " per hour" : ""}
              {paymentType === "complimentary" ? " — Auto-set to 0" : ""}
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                className="pl-9"
                type="number"
                min={0}
                value={amountOverride}
                onChange={(e) => setAmountOverride(e.target.value)}
                disabled={paymentType === "complimentary"}
              />
            </div>
          </div>
        </div>
        {selectedPackage && (
          <div className="bg-stone-50 rounded-lg px-4 py-3 text-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">
                Amount
                {isHourly ? ` (${quantity} unit${quantity !== 1 ? "s" : ""} × ₹${amountOverride || 0})` : ""}
              </span>
              <span className="font-medium text-stone-700">{formatINR(totalAmount)}</span>
            </div>
            {gstBreakdown.totalGst > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">CGST ({gstRate / 2}%)</span>
                  <span className="text-stone-500">₹{gstBreakdown.cgstAmount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">SGST ({gstRate / 2}%)</span>
                  <span className="text-stone-500">₹{gstBreakdown.sgstAmount}</span>
                </div>
              </>
            )}
            <div className="pt-2 mt-1 border-t border-stone-200 flex items-center justify-between">
              <span className="font-bold text-stone-900">Total Amount Due</span>
              <span className="font-bold text-stone-900 text-base">{formatINR(finalTotalAmount)}</span>
            </div>
          </div>
        )}
        {/* Status selection */}
        <div className="space-y-1.5">
          <Label>Booking Status *</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBookingStatus("confirmed")}
              className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                bookingStatus === "confirmed"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Confirmed (Direct)
            </button>
            <button
              type="button"
              onClick={() => setBookingStatus("awaiting_payment")}
              className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                bookingStatus === "awaiting_payment"
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              Awaiting Payment
            </button>
          </div>
          <p className="text-xs text-stone-400">
            {bookingStatus === "confirmed"
              ? "Booking is immediately confirmed. Use this for cash/complimentary/already paid bookings."
              : "Booking is pending payment. Use this to follow up later."}
          </p>
        </div>
      </div>

      {/* ── Admin Notes ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4" /> Internal Notes
        </h2>
        <div className="space-y-1.5">
          <Label>Admin Notes (optional)</Label>
          <Textarea
            placeholder="e.g. Owner's guest — Block C President. Cash collected by Rajesh."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-stone-400">These notes are only visible to admins, not to the customer.</p>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/bookings")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
          className="text-white hover:opacity-90 disabled:opacity-40 gap-2 min-w-36"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
          ) : (
            "Create Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
