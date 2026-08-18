import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { RouteProgressBar } from "@/components/public/RouteProgressBar";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Clubhouse Booking",
    template: "%s | Clubhouse Booking",
  },
  description:
    "Book premium clubhouse facilities — banquet halls, sports courts, guest rooms, swimming pools and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}

