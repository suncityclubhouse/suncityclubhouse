/**
 * GET /api/invoice/multi/list
 *
 * Returns all confirmed + completed bookings (with facility name)
 * for the multi-invoice booking picker modal.
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // never cache — admin auth required

export async function GET() {
  // Require admin session
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  const { data, error } = await db
    .from("bookings")
    .select(
      "id, booking_ref, created_at, customer_name, customer_phone, customer_email, is_resident, house_number, " +
      "booking_date, end_date, start_time, end_time, slot_type, quantity, status, " +
      "base_amount, total_amount, gst_percentage, cgst_amount, sgst_amount, is_gst_inclusive, " +
      "event_purpose, payment_type, payment_mode, " +
      "facility:facilities(id,name)"
    )
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false })
    .limit(500); // sensible cap

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
