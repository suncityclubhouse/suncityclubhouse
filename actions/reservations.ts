"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateSessionToken } from "@/lib/utils/formatters";
import { getReservationExpiry } from "@/lib/utils/dates";
import type { SlotType, TemporaryReservation } from "@/types/database";
import type { ActionResult } from "@/types";

/**
 * Create a 15-minute temporary reservation to hold the slot.
 * Called when user enters the booking wizard (Step 1 → Step 2).
 */
export async function createTemporaryReservation(params: {
  facilityId: string;
  bookingDate: string;
  slotType: SlotType;
  startTime?: string;
  endTime?: string;
  endDate?: string;
}): Promise<ActionResult<{ sessionToken: string; expiresAt: string }>> {
  const db = createAdminClient();

  // First, clean up expired reservations for this facility (proactive cleanup)
  await db
    .from("temporary_reservations")
    .delete()
    .lt("expires_at", new Date().toISOString());

  // Check for existing slot conflict with active reservations
  if (params.startTime && params.endTime) {
    const { data: conflicts } = await db
      .from("temporary_reservations")
      .select("id")
      .eq("facility_id", params.facilityId)
      .eq("booking_date", params.bookingDate)
      .gt("expires_at", new Date().toISOString())
      .lt("start_time", params.endTime)
      .gt("end_time", params.startTime);

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: "This slot is temporarily held by another user. Please try again in a few minutes." };
    }
  }

  const sessionToken = generateSessionToken();
  const expiresAt = getReservationExpiry();

  const { error } = await db.from("temporary_reservations").insert({
    facility_id: params.facilityId,
    booking_date: params.bookingDate,
    start_time: params.startTime ?? null,
    end_time: params.endTime ?? null,
    end_date: params.endDate ?? null,
    slot_type: params.slotType,
    session_token: sessionToken,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[createTemporaryReservation]", error);
    return { success: false, error: "Failed to hold the slot. Please try again." };
  }

  return { success: true, data: { sessionToken, expiresAt } };
}

/**
 * Release a temporary reservation by session token.
 * Called when user exits the wizard without completing booking.
 */
export async function releaseTemporaryReservation(
  sessionToken: string
): Promise<ActionResult> {
  const db = createAdminClient();
  const { error } = await db
    .from("temporary_reservations")
    .delete()
    .eq("session_token", sessionToken);

  if (error) {
    return { success: false, error: "Failed to release reservation." };
  }
  return { success: true };
}

/**
 * Release all expired temporary reservations.
 * Called by the Vercel cron job every 5 minutes.
 */
export async function releaseExpiredReservations(): Promise<ActionResult<{ count: number }>> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("temporary_reservations")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("[releaseExpiredReservations]", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: { count: data?.length ?? 0 } };
}

/**
 * Get reservation by session token (to validate it's still valid for booking).
 */
export async function getReservationByToken(
  sessionToken: string
): Promise<TemporaryReservation | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("temporary_reservations")
    .select("*")
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .single();

  return data ?? null;
}
