import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/lib/utils/formatters";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

interface StepConfirmationProps {
  bookingRef: string;
  facilityName: string;
}

export function StepConfirmation({ bookingRef, facilityName }: StepConfirmationProps) {
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
          Your booking for <strong>{facilityName}</strong> is under review. You'll receive a
          confirmation email once our team verifies your payment (usually within 2–4 hours).
        </p>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-xl px-6 py-4 w-full max-w-xs">
        <p className="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Booking Reference</p>
        <p className="text-2xl font-bold font-mono text-stone-900 tracking-wider">{bookingRef}</p>
        <p className="text-xs text-stone-400 mt-1">Keep this for your records</p>
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
        <Button asChild className="gap-2 flex-1" variant="outline">
          <Link href="/">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <p className="text-xs text-stone-400 max-w-sm">
        A confirmation email has been sent to you. If you don't receive it within 15 minutes,
        please check your spam folder or contact us on WhatsApp.
      </p>
    </div>
  );
}
