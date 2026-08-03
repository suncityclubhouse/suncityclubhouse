/**
 * GET /api/invoice/[bookingId]
 *
 * Streams a PDF invoice for a booking.
 * Accessible to:
 *  - Admin (authenticated Supabase session)
 *  - Public (via ?ref=BOOKING_REF as a simple identity check)
 *
 * Query params:
 *  - ref (optional): booking_ref for public access (used in Track Booking page)
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React, { createElement } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BookingInvoice } from "@/components/shared/BookingInvoice";
import type { BookingWithFacility } from "@/types/database";
import path from "path";
import fs from "fs";

const SOCIETY_ID = process.env.NEXT_PUBLIC_SOCIETY_ID!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const { searchParams } = new URL(request.url);
  const publicRef = searchParams.get("ref"); // optional public access param

  const db = createAdminClient();

  // 1. Fetch the booking
  const { data: booking, error } = await db
    .from("bookings")
    .select("*, facility:facilities(id,name,slug,thumbnail_url), package:facility_packages(id,name,type)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 2. Authorization:
  //    a) Admin session — allow all
  //    b) Public — require ?ref matching booking_ref
  const isPublicAccess = !!publicRef;

  if (isPublicAccess) {
    if (booking.booking_ref !== publicRef.trim().toUpperCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else {
    // Check admin session
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 3. Fetch society info for the invoice header
  const { data: society } = await db
    .from("societies")
    .select("name, address, whatsapp_number")
    .eq("id", SOCIETY_ID)
    .single();

  // 4. Load the MG logo as base64 so it embeds in the PDF
  let logoDataUrl: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "MG logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch {
    // Logo not found — PDF will render without it
  }

  // 5. Render PDF — react-pdf's renderToBuffer expects a ReactElement<DocumentProps>
  //    BookingInvoice returns a <Document> so we cast through unknown to satisfy the strict type.
  const invoiceElement = createElement(BookingInvoice, {
    booking: booking as unknown as BookingWithFacility,
    societyName: society?.name ?? "Mahavir Suncity Clubhouse",
    societyAddress: society?.address ?? "Mahavir Suncity, Kanchanbagh, Rajnandgaon",
    societyPhone: society?.whatsapp_number ?? "8109991507",
    logoUrl: logoDataUrl,
  }) as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;

  const pdfBuffer = await renderToBuffer(invoiceElement);

  // 6. Stream the PDF as a download
  const filename = `Invoice-${booking.booking_ref}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
