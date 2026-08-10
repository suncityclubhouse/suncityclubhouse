"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  CheckCircle2,
  Copy,
  MessageCircle,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { uploadPaymentProof } from "@/actions/bookings";
import { getRemainingSeconds, formatCountdown } from "@/lib/utils/dates";
import { formatINR, getWhatsAppUrl } from "@/lib/utils/formatters";
import { paymentUploadSchema, type PaymentUploadSchema } from "@/lib/validations/booking";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "";
const UPI_QR = process.env.NEXT_PUBLIC_UPI_QR_URL ?? "";
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const TOTAL_SECONDS = 15 * 60;

interface StepPaymentProps {
  bookingId: string;
  bookingRef: string;
  expiresAt: string;
  totalAmount: number;
  baseAmount: number;
  gstPercentage: number;
  isGstInclusive: boolean;
  cgstAmount: number;
  sgstAmount: number;
  /** Restored upload from session (after refresh) */
  restoredUpload?: { url: string; publicId: string } | null;
  /** Called whenever a new file is uploaded so the wizard can persist it */
  onUploadComplete?: (url: string, publicId: string) => void;
  onSuccess: () => void;
}

export function StepPayment({
  bookingId,
  bookingRef,
  expiresAt,
  totalAmount,
  baseAmount,
  gstPercentage,
  isGstInclusive,
  cgstAmount,
  sgstAmount,
  restoredUpload,
  onUploadComplete,
  onSuccess,
}: StepPaymentProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => getRemainingSeconds(expiresAt));
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(restoredUpload?.url ?? null);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(restoredUpload?.publicId ?? null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PaymentUploadSchema>({
    resolver: zodResolver(paymentUploadSchema),
    defaultValues: {
      // Pre-populate if we restored an upload from session
      paymentProofUrl: restoredUpload?.url ?? "",
      paymentPublicId: restoredUpload?.publicId ?? "",
    },
  });

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(getRemainingSeconds(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = secondsLeft <= 0;
  const progressPct = Math.max(0, (secondsLeft / TOTAL_SECONDS) * 100);
  const isUrgent = secondsLeft > 0 && secondsLeft < 120;

  // ── Copy UPI ID ────────────────────────────────────────────────────────────
  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success("UPI ID copied!", { duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    const isImageMime = file.type.startsWith("image/");
    const isHeicExt = file.name.toLowerCase().match(/\.(heic|heif)$/);

    if (!isImageMime && !isHeicExt) {
      toast.error("Please upload an image file (JPG, PNG, HEIC, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "clubhouse/payments");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");

      const url: string = data.url;
      const publicId: string = data.publicId ?? "";

      setUploadedUrl(url);
      setUploadedPublicId(publicId);
      form.setValue("paymentProofUrl", url);
      form.setValue("paymentPublicId", publicId);

      // Notify parent to persist the upload in session
      onUploadComplete?.(url, publicId);

      toast.success("Screenshot uploaded!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearUpload = () => {
    setUploadedUrl(null);
    setUploadedPublicId(null);
    form.setValue("paymentProofUrl", "");
    form.setValue("paymentPublicId", "");
    // Notify parent to clear the persisted upload from session
    onUploadComplete?.("__clear__", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: PaymentUploadSchema) => {
    if (isExpired) {
      toast.error("Your booking window has expired. Please start a new booking.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await uploadPaymentProof({
        bookingId,
        paymentProofUrl: values.paymentProofUrl,
        paymentPublicId: values.paymentPublicId,
        paymentReference: values.paymentReference,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to submit payment");
        return;
      }

      toast.success("Payment submitted! Awaiting admin approval.");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Complete Payment</h2>
        <p className="text-sm text-stone-500 mt-1">
          Booking Ref: <span className="font-mono font-semibold text-stone-800 tracking-wider">{bookingRef}</span>
        </p>
      </div>

      {/* ── Timer ── */}
      <div
        className={`rounded-xl p-4 border transition-colors ${
          isExpired
            ? "bg-red-50 border-red-200"
            : isUrgent
            ? "bg-orange-50 border-orange-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-sm font-medium ${
              isExpired ? "text-red-700" : isUrgent ? "text-orange-700" : "text-blue-700"
            }`}
          >
            {isExpired ? "⚠️ Session Expired" : isUrgent ? "🔴 Hurry! Time is running out" : "⏱ Time Remaining to Pay"}
          </span>
          <span
            className={`font-mono text-xl font-bold ${
              isExpired ? "text-red-700" : isUrgent ? "text-orange-600 animate-pulse" : "text-blue-700"
            }`}
          >
            {formatCountdown(secondsLeft)}
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
        {isExpired && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <p className="text-xs text-red-600">
              Your slot has been released. You may start a fresh booking.
            </p>
            <a
              onClick={() => {
                // Clear the expired session so user gets a fresh start
                try { sessionStorage.clear(); } catch {}
                window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start New Booking
            </a>
          </div>
        )}
      </div>

      {/* ── Payment instructions (only when not expired) ── */}
      {!isExpired && (
        <>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                Payment Instructions
              </h3>
            </div>

            <div className="p-5 flex flex-col sm:flex-row gap-6 items-start">

              {/* QR Code */}
              {UPI_QR && (
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-44 h-44 border-2 border-stone-200 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={UPI_QR}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    📱 Scan to pay instantly
                  </span>
                </div>
              )}

              {/* Right side — amounts + UPI + steps */}
              <div className="flex-1 space-y-4 min-w-0">

                {/* Amount breakdown card */}
                <div className="bg-stone-50 rounded-xl border border-stone-100 divide-y divide-stone-100">
                  {/* Base amount — only show separately when GST is added on top */}
                  {gstPercentage > 0 && !isGstInclusive && (
                    <div className="flex justify-between items-center text-sm px-4 py-2.5">
                      <span className="text-stone-500">Base Amount</span>
                      <span className="font-medium text-stone-700">{formatINR(baseAmount)}</span>
                    </div>
                  )}
                  {gstPercentage > 0 && (
                    <>
                      <div className="flex justify-between items-center text-xs px-4 py-2">
                        <span className="text-stone-400">CGST ({gstPercentage / 2}%)</span>
                        <span className="text-stone-500">+ ₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs px-4 py-2">
                        <span className="text-stone-400">SGST ({gstPercentage / 2}%)</span>
                        <span className="text-stone-500">+ ₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm font-bold text-stone-900">Total Amount Due</span>
                    <span className="text-2xl font-bold text-stone-900">{formatINR(totalAmount)}</span>
                  </div>
                </div>

                {/* UPI ID row */}
                {UPI_ID && (
                  <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-blue-500 font-medium mb-0.5">UPI ID</p>
                      <a
                        href={`upi://pay?pa=${UPI_ID}&pn=Clubhouse&am=${totalAmount}&cu=INR`}
                        className="font-mono font-semibold text-blue-700 text-sm break-all hover:text-blue-900 transition-colors flex items-center gap-1.5"
                        title="Tap to open in your payment app"
                      >
                        <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
                        {UPI_ID}
                      </a>
                      <p className="text-xs text-blue-400 mt-0.5">Tap to open payment app</p>
                    </div>
                    <button
                      onClick={copyUPI}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                        copied
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-100"
                      }`}
                      title="Copy UPI ID"
                    >
                      {copied ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                )}

                {/* Steps */}
                <ol className="text-sm text-stone-600 space-y-1.5 list-decimal list-inside">
                  <li>Open GPay / PhonePe / Paytm or any UPI app</li>
                  <li>Pay <strong>{formatINR(totalAmount)}</strong> to the UPI ID above (or scan QR)</li>
                  <li>Take a screenshot of the payment confirmation screen</li>
                  <li>Upload the screenshot and enter your UTR number below</li>
                </ol>

                {/* WhatsApp help */}
                {WHATSAPP && (
                  <a
                    href={getWhatsAppUrl(
                      WHATSAPP,
                      `Hi, I've made a payment for booking ${bookingRef}. Amount: ₹${totalAmount}. Please confirm.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact manager on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Upload proof form ── */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                  Upload Payment Screenshot
                </h3>
              </div>

              <div className="p-5 space-y-4">
                {/* Drop zone */}
                <div className="relative">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploadedUrl && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      uploadedUrl
                        ? "border-emerald-300 bg-emerald-50 cursor-default"
                        : dragOver
                        ? "border-blue-500 bg-blue-50 cursor-pointer"
                        : "border-slate-300 hover:border-blue-400 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif,.HEIC,.HEIF"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
                        <p className="text-sm text-stone-500 font-medium">Uploading your screenshot…</p>
                      </div>
                    ) : uploadedUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                        <p className="text-sm font-semibold text-emerald-700">Screenshot uploaded!</p>
                        <p className="text-xs text-stone-400">
                          {restoredUpload?.url === uploadedUrl ? "Restored from previous session" : "File received and secured"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-9 h-9 text-stone-400" />
                        <p className="text-sm font-semibold text-stone-600">Drag & drop or click to upload</p>
                        <p className="text-xs text-stone-400">JPG, PNG, HEIC · Max 10 MB</p>
                      </div>
                    )}
                  </div>

                  {/* Replace / clear button when uploaded */}
                  {uploadedUrl && !uploading && (
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Replace screenshot
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={clearUpload}
                        className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  )}
                </div>

                {form.formState.errors.paymentProofUrl && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    ⚠️ Please upload your payment screenshot to continue
                  </p>
                )}

                {/* UTR / reference */}
                <div className="space-y-1.5">
                  <Label htmlFor="paymentReference">
                    UTR / Transaction Reference Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="paymentReference"
                    placeholder="12-digit UTR or reference number shown after payment"
                    {...form.register("paymentReference")}
                    aria-invalid={!!form.formState.errors.paymentReference}
                  />
                  {form.formState.errors.paymentReference && (
                    <p className="text-xs text-red-500">{form.formState.errors.paymentReference.message}</p>
                  )}
                  <p className="text-xs text-stone-400">
                    Find this in your payment app under transaction details (also called Reference ID or UPI Ref No.)
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || uploading || !uploadedUrl}
              className="w-full text-white font-semibold h-12 text-base"
              style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting payment…</>
              ) : (
                "Submit Payment for Approval →"
              )}
            </Button>

            <p className="text-xs text-center text-stone-400">
              Your booking will be confirmed once our team verifies the payment (usually within 2–4 hours).
            </p>
          </form>
        </>
      )}
    </div>
  );
}
