"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, Home, Copy, Check, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/lib/utils/formatters";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

interface StepConfirmationProps {
  bookingRef: string;
  facilityName: string;
}

export function StepConfirmation({ bookingRef, facilityName }: StepConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="flex flex-col items-center text-center py-8 px-4 space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-stone-900">
          Payment Submitted!
        </h2>
        <p className="text-stone-500 max-w-sm leading-relaxed">
          Your booking for <strong>{facilityName}</strong> is under review. You&apos;ll receive a
          confirmation once our team verifies your payment (usually within 2–4 hours).
        </p>
      </div>

      {/* Ref number card */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl px-6 py-4 w-full max-w-xs space-y-3">
        <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">Booking Reference</p>
        <p className="text-3xl font-bold font-mono text-stone-900 tracking-[0.2em]">{bookingRef}</p>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 mx-auto text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-600">Copied!</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5" />Copy to clipboard</>
          )}
        </button>
      </div>

      {/* ⚠️ Save this warning */}
      <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-left space-y-1">
        <p className="text-sm font-semibold text-amber-800">⚠️ Save this reference number!</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          You will need this code to track your booking status later. Please screenshot this page or copy the code — once you leave, you won&apos;t see it again.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {WHATSAPP && (
          <Button
            asChild
            variant="outline"
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <a
              href={getWhatsAppUrl(WHATSAPP, `Hi, I've submitted my booking (Ref: ${bookingRef}). Please confirm the status.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </Button>
        )}
        <Button asChild variant="outline" className="gap-2 flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
          <Link href={`/track-booking?ref=${bookingRef}`}>
            <Search className="w-4 h-4" />
            Track Booking
          </Link>
        </Button>
        <Button asChild className="gap-2 flex-1" variant="outline">
          <Link href="/">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </Button>
      </div>

      <p className="text-xs text-stone-400 max-w-sm">
        A confirmation email has been sent to you. If you don&apos;t receive it within 15 minutes,
        please check your spam folder or contact us on WhatsApp.
      </p>
    </div>
  );
}
