"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getConfirmedBookingsForInvoice() {
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const db = createAdminClient();

  const { data, error } = await db
    .from("bookings")
    .select(
      "id, booking_ref, created_at, customer_name, customer_phone, customer_email, is_resident, house_number, " +
      "booking_date, end_date, start_time, end_time, slot_type, quantity, status, " +
      "base_amount, total_amount, gst_percentage, cgst_amount, sgst_amount, is_gst_inclusive, " +
      "event_purpose, payment_type, " +
      "facility:facilities(id,name)"
    )
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as any[];
}
