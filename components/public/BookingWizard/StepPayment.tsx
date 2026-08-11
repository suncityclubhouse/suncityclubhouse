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
  QrCode,
  ChevronDown,
  ChevronUp,
  Camera,
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
  restoredUpload?: { url: string; publicId: string } | null;
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
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PaymentUploadSchema>({
    resolver: zodResolver(paymentUploadSchema),
    defaultValues: {
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
  const copyUPI = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      toast.success("UPI ID copied to clipboard!", { duration: 1500 });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard
      toast.error("Could not copy. Please tap the UPI ID to select it manually.");
    }
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
      form.setValue("paymentProofUrl", url);
      form.setValue("paymentPublicId", publicId);
      onUploadComplete?.(url, publicId);

      toast.success("Screenshot uploaded successfully!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearUpload = () => {
    setUploadedUrl(null);
    form.setValue("paymentProofUrl", "");
    form.setValue("paymentPublicId", "");
    onUploadComplete?.("__clear__", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
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
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Complete Payment</h2>
        <p className="text-sm text-stone-500 mt-0.5">
          Ref: <span className="font-mono font-semibold text-stone-800 tracking-wider">{bookingRef}</span>
        </p>
      </div>

      {/* ── Timer ── */}
      <div className={`rounded-xl p-4 border transition-colors ${
        isExpired ? "bg-red-50 border-red-200" : isUrgent ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isExpired ? "text-red-700" : isUrgent ? "text-orange-700" : "text-blue-700"}`}>
            {isExpired ? "⚠️ Session Expired" : isUrgent ? "🔴 Hurry! Time is running out" : "⏱ Time to Pay"}
          </span>
          <span className={`font-mono text-xl font-bold ${isExpired ? "text-red-700" : isUrgent ? "text-orange-600 animate-pulse" : "text-blue-700"}`}>
            {formatCountdown(secondsLeft)}
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
        {isExpired && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <p className="text-xs text-red-600">Your slot has been released. You may start a fresh booking.</p>
            <button
              onClick={() => { try { sessionStorage.clear(); } catch {} window.location.reload(); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start New Booking
            </button>
          </div>
        )}
      </div>

      {/* ── Payment section (only when not expired) ── */}
      {!isExpired && (
        <>
          {/* ── AMOUNT CARD ── */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Amount Due</h3>
            </div>
            <div className="divide-y divide-stone-100">
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
              <div className="flex justify-between items-center px-4 py-4">
                <span className="text-base font-bold text-stone-900">Total to Pay</span>
                <span className="text-3xl font-bold text-stone-900">{formatINR(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── MOBILE-FIRST: Big Pay Now button + UPI ID ── */}
          {UPI_ID && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Pay via UPI</h3>
              </div>

              <div className="p-4 space-y-3">
                {/* PRIMARY CTA — big tap-to-pay button, most important on mobile */}
                <a
                  href={`upi://pay?pa=${UPI_ID}&pn=Suncity+Clubhouse&am=${totalAmount}&cu=INR&tn=Booking+${bookingRef}`}
                  className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg py-4 px-5 rounded-xl transition-colors shadow-md shadow-blue-200 select-none"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Smartphone className="w-6 h-6 flex-shrink-0" />
                  Pay {formatINR(totalAmount)} with UPI
                </a>
                <p className="text-xs text-center text-stone-400">
                  Opens GPay / PhonePe / Paytm automatically
                </p>

                {/* UPI ID — large, easy to read and copy */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <p className="text-xs text-stone-500 font-medium mb-2">Or pay manually using UPI ID:</p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-stone-900 text-base flex-1 select-all break-all">
                      {UPI_ID}
                    </p>
                    <button
                      onClick={copyUPI}
                      className={`flex-shrink-0 flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all min-w-[80px] justify-center ${
                        copied
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                      }`}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {copied ? (
                        <><CheckCircle2 className="w-4 h-4" /> Copied</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy</>
                      )}
                    </button>
                  </div>
                </div>

                {/* QR code — collapsed on mobile (useless on phone), open on desktop */}
                {UPI_QR && (
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowQR((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <QrCode className="w-4 h-4 text-stone-400" />
                        {showQR ? "Hide QR Code" : "Show QR Code (scan from another device)"}
                      </span>
                      {showQR ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                    </button>
                    {showQR && (
                      <div className="px-4 pb-4 flex flex-col items-center gap-2 border-t border-stone-100 pt-4">
                        <div className="w-52 h-52 border-2 border-stone-200 rounded-xl overflow-hidden flex items-center justify-center bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={UPI_QR} alt="UPI QR Code" className="w-full h-full object-contain p-2" />
                        </div>
                        <p className="text-xs text-stone-400 text-center">
                          Scan this QR from another phone or computer's camera
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp help */}
                {WHATSAPP && (
                  <a
                    href={getWhatsAppUrl(WHATSAPP, `Hi, I've made a payment for booking ${bookingRef}. Amount: ₹${totalAmount}. Please confirm.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full text-sm text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 px-4 py-3 rounded-xl transition-colors"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Need help? WhatsApp us
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── UPLOAD PROOF FORM ── */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                  Upload Payment Screenshot
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  After paying, upload a screenshot of your payment confirmation
                </p>
              </div>

              <div className="p-4 space-y-4">

                {/* Upload area */}
                {!uploadedUrl ? (
                  <div className="space-y-2">
                    {/* Camera button — mobile primary action */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center justify-center gap-3 w-full bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {uploading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
                      ) : (
                        <><Camera className="w-5 h-5" /> Take / Choose Screenshot</>
                      )}
                    </button>

                    {/* Hidden camera input — opens camera on mobile, file picker on desktop */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Drag & drop zone — desktop fallback */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`hidden sm:flex border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex-col items-center gap-2 ${
                        dragOver ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif,.HEIC,.HEIF"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Upload className="w-7 h-7 text-stone-400" />
                      <p className="text-sm text-stone-500">or drag & drop a file here</p>
                      <p className="text-xs text-stone-400">JPG, PNG, HEIC · Max 10 MB</p>
                    </div>
                  </div>
                ) : (
                  /* Uploaded state */
                  <div className="flex flex-col items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-emerald-700">Screenshot uploaded!</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {restoredUpload?.url === uploadedUrl ? "Restored from previous session" : "File received and secured"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 py-1.5 px-3 rounded-lg bg-white border border-blue-200"
                      >
                        <Upload className="w-3.5 h-3.5" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={clearUpload}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 py-1.5 px-3 rounded-lg bg-white border border-red-200"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}

                {form.formState.errors.paymentProofUrl && (
                  <p className="text-xs text-red-500">⚠️ Please upload your payment screenshot to continue</p>
                )}

                {/* UTR field */}
                <div className="space-y-1.5">
                  <Label htmlFor="paymentReference" className="text-sm font-semibold text-stone-800">
                    UTR / Transaction Reference <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="paymentReference"
                    placeholder="e.g. 426811234567"
                    {...form.register("paymentReference")}
                    aria-invalid={!!form.formState.errors.paymentReference}
                    className="text-base h-12" // larger on mobile for easier typing
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                  {form.formState.errors.paymentReference && (
                    <p className="text-xs text-red-500">{form.formState.errors.paymentReference.message}</p>
                  )}
                  <p className="text-xs text-stone-400">
                    Find this in your payment app → Transaction Details → UTR / Reference No.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps summary */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <ol className="text-sm text-stone-600 space-y-1 list-decimal list-inside">
                <li>Tap <strong>"Pay with UPI"</strong> above — your payment app opens</li>
                <li>Pay <strong>{formatINR(totalAmount)}</strong> and wait for the confirmation screen</li>
                <li>Take a screenshot of the success screen</li>
                <li>Come back here, upload the screenshot and enter the UTR number</li>
              </ol>
            </div>

            <Button
              type="submit"
              disabled={submitting || uploading || !uploadedUrl}
              className="w-full text-white font-bold h-14 text-base rounded-xl shadow-md"
              style={{ background: "linear-gradient(135deg, #07377a, #08428C)" }}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting…</>
              ) : (
                "Submit Payment for Approval →"
              )}
            </Button>

            <p className="text-xs text-center text-stone-400 pb-2">
              Your booking is confirmed once our team verifies the payment (usually within 2–4 hours).
            </p>
          </form>
        </>
      )}
    </div>
  );
}
