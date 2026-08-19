/**
 * POST /api/invoice/multi
 *
 * Accepts a JSON body: { bookingIds: string[] }
 * Returns a consolidated PDF invoice for all supplied bookings.
 * Admin-only (requires active Supabase session).
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React, { createElement } from "react";
import path from "path";
import fs from "fs";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MultiBookingInvoice } from "@/components/shared/MultiBookingInvoice";
import type { BookingWithFacility } from "@/types/database";

const SOCIETY_ID = process.env.NEXT_PUBLIC_SOCIETY_ID!;

export async function POST(request: NextRequest) {
  // 1. Require admin session
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let bookingIds: string[] = [];
  try {
    const body = await request.json();
    bookingIds = Array.isArray(body.bookingIds) ? body.bookingIds : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (bookingIds.length === 0) {
    return NextResponse.json({ error: "No bookings selected" }, { status: 400 });
  }

  const db = createAdminClient();

  // 3. Fetch all requested bookings (with facility + package info)
  const { data: bookings, error } = await db
    .from("bookings")
    .select(
      "*, facility:facilities(id,name,slug,thumbnail_url), package:facility_packages(id,name,type)"
    )
    .in("id", bookingIds)
    .order("booking_date", { ascending: true });

  if (error || !bookings || bookings.length === 0) {
    return NextResponse.json({ error: "Bookings not found" }, { status: 404 });
  }

  // 4. Fetch society info
  const { data: society } = await db
    .from("societies")
    .select("name, address, whatsapp_number")
    .eq("id", SOCIETY_ID)
    .single();

  // 5. Load logo as base64
  let logoDataUrl: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "MG logo.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch {
    // PDF will render without logo
  }

  // 6. Render PDF
  const invoiceElement = createElement(MultiBookingInvoice, {
    bookings: bookings as unknown as BookingWithFacility[],
    societyName: society?.name ?? "MS Vardhman Reality",
    societyAddress: society?.address ?? "Mahavir Suncity, Kanchanbagh, Rajnandgaon",
    societyPhone: society?.whatsapp_number ?? "8109991507",
    logoUrl: logoDataUrl,
  }) as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;

  const pdfBuffer = await renderToBuffer(invoiceElement);

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const filename = `Invoice-${bookings.length}Bookings-${stamp}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
