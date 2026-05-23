"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, Copy, MessageCircle } from "lucide-react";
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
const TOTAL_SECONDS = 15 * 60; // 15 minutes

interface StepPaymentProps {
  bookingId: string;
  bookingRef: string;
  expiresAt: string;
  totalAmount: number;
  onSuccess: () => void;
}

export function StepPayment({ bookingId, bookingRef, expiresAt, totalAmount, onSuccess }: StepPaymentProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => getRemainingSeconds(expiresAt));
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PaymentUploadSchema>({
    resolver: zodResolver(paymentUploadSchema),
  });

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(getRemainingSeconds(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = secondsLeft <= 0;
  const progressPct = Math.max(0, (secondsLeft / TOTAL_SECONDS) * 100);

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5 MB");
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

      setUploadedUrl(data.url);
      setUploadedPublicId(data.publicId ?? "");
      form.setValue("paymentProofUrl", data.url);
      form.setValue("paymentPublicId", data.publicId ?? "");
      toast.success("Screenshot uploaded successfully!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
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

  const onSubmit = async (values: PaymentUploadSchema) => {
    if (isExpired) {
      toast.error("Booking has expired. Please start a new booking.");
      return;
    }

    setUploading(true);
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
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-stone-900">Complete Payment</h2>
        <p className="text-sm text-stone-500 mt-1">Ref: <span className="font-medium text-stone-700">{bookingRef}</span></p>
      </div>

      {/* Timer */}
      <div className={`rounded-xl p-4 border ${isExpired ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isExpired ? "text-red-700" : "text-amber-700"}`}>
            {isExpired ? "⚠️ Booking Expired" : "⏱ Time Remaining to Pay"}
          </span>
          <span className={`font-mono text-xl font-bold ${isExpired ? "text-red-700" : secondsLeft < 120 ? "text-red-600" : "text-amber-700"}`}>
            {formatCountdown(secondsLeft)}
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
        {isExpired && (
          <p className="text-xs text-red-600 mt-2">Your slot has been released. Please start a new booking.</p>
        )}
      </div>

      {!isExpired && (
        <>
          {/* UPI Payment details */}
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">Payment Instructions</h3>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* QR Code */}
              {UPI_QR && (
                <div className="flex-shrink-0">
                  <div className="w-44 h-44 relative border-2 border-stone-200 rounded-xl overflow-hidden">
                    <Image src={UPI_QR} alt="UPI QR Code" fill className="object-contain p-2" />
                  </div>
                  <p className="text-xs text-center text-stone-400 mt-1">Scan to pay</p>
                </div>
              )}

              {/* Payment details */}
              <div className="space-y-4 flex-1">
                <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">Amount Due</span>
                    <span className="text-xl font-bold text-stone-900">{formatINR(totalAmount)}</span>
                  </div>
                  {UPI_ID && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-500">UPI ID</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-900 text-sm">{UPI_ID}</span>
                        <button
                          onClick={copyUPI}
                          className="text-amber-600 hover:text-amber-800 p-1 rounded"
                          aria-label="Copy UPI ID"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <ol className="text-sm text-stone-600 space-y-1.5 list-decimal list-inside">
                  <li>Open your UPI app (GPay, PhonePe, Paytm etc.)</li>
                  <li>Pay <strong>{formatINR(totalAmount)}</strong> to the UPI ID above</li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Upload it below along with the UTR/reference number</li>
                </ol>

                {WHATSAPP && (
                  <a
                    href={getWhatsAppUrl(WHATSAPP, `Hi, I've made a payment for booking ${bookingRef}. Amount: ₹${totalAmount}. Please confirm.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact manager on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Upload form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Upload Payment Proof</h3>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-amber-500 bg-amber-50"
                    : uploadedUrl
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-stone-300 hover:border-amber-400 hover:bg-stone-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                    <p className="text-sm text-stone-500">Uploading…</p>
                  </div>
                ) : uploadedUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">Screenshot uploaded!</p>
                    <p className="text-xs text-stone-400">Click to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-stone-400" />
                    <p className="text-sm font-medium text-stone-600">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-stone-400">JPG, PNG · Max 5 MB</p>
                  </div>
                )}
              </div>

              {form.formState.errors.paymentProofUrl && (
                <p className="text-xs text-red-500">Please upload your payment screenshot</p>
              )}

              {/* UTR/reference */}
              <div className="space-y-1.5">
                <Label htmlFor="paymentReference">UTR / Transaction Reference Number *</Label>
                <Input
                  id="paymentReference"
                  placeholder="Enter the UTR or reference number from your payment"
                  {...form.register("paymentReference")}
                  aria-invalid={!!form.formState.errors.paymentReference}
                />
                {form.formState.errors.paymentReference && (
                  <p className="text-xs text-red-500">{form.formState.errors.paymentReference.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={uploading || !uploadedUrl}
              className="w-full text-white"
              style={{ backgroundColor: "#8b6914" }}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
              ) : (
                "Submit Payment for Approval →"
              )}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
