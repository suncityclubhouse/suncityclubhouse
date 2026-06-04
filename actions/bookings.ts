"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getReservationByToken } from "@/actions/reservations";
import { getBookingExpiry, calculateEndDate } from "@/lib/utils/dates";
import {
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
} from "@/lib/resend";
import type { Booking, BookingStatus } from "@/types/database";
import type { ActionResult, BookingFilters } from "@/types";
import type { BookingFormSchema } from "@/lib/validations/booking";

const SOCIETY_ID = process.env.NEXT_PUBLIC_SOCIETY_ID!;
const ADMIN_EMAIL = process.env.RESEND_FROM_EMAIL!;

// ============================================================
// CREATE BOOKING
// ============================================================

export async function createBooking(params: {
  facilityId: string;
  packageId: string;
  sessionToken: string;
  slotType: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  endDate?: string;
  baseAmount: number;
  totalAmount: number;
  formValues: BookingFormSchema;
}): Promise<ActionResult<{ bookingId: string; bookingRef: string; expiresAt: string }>> {
  const db = createAdminClient();

  // 1. Validate the temporary reservation is still valid
  const reservation = await getReservationByToken(params.sessionToken);
  if (!reservation) {
    return {
      success: false,
      error: "Your slot hold has expired. Please start the booking process again.",
    };
  }

  // 2. Release the user's own temp reservation FIRST so it doesn't
  //    conflict with the availability check (which also checks temp_reservations)
  await db
    .from("temporary_reservations")
    .delete()
    .eq("session_token", params.sessionToken);

  // 3. Double-booking prevention: use Supabase function to check availability
  const { data: isAvailable, error: checkError } = await db.rpc(
    "check_slot_availability",
    {
      p_facility_id: params.facilityId,
      p_booking_date: params.bookingDate,
      p_start_time: params.startTime ?? null,
      p_end_time: params.endTime ?? null,
      p_slot_type: params.slotType,
      p_exclude_id: null,
      p_end_date: params.endDate ?? null,
    }
  );

  if (checkError) {
    console.error("[createBooking] availability check error:", checkError);
    return { success: false, error: "Could not verify slot availability. Please try again." };
  }

  if (!isAvailable) {
    return {
      success: false,
      error: "This slot was just booked by someone else. Please select a different date or slot.",
    };
  }

  // 3. Generate booking ref
  const { data: refData, error: refError } = await db.rpc("generate_booking_ref");
  if (refError || !refData) {
    return { success: false, error: "Could not generate booking reference." };
  }

  const bookingRef = refData as string;
  const expiresAt = getBookingExpiry();
  const { formValues } = params;

  // 4. Compute end_date for multi-day types (server-side safety net)
  const endDate = params.endDate ?? calculateEndDate(params.bookingDate, params.slotType);

  // 5. Insert booking
  const { data: booking, error: insertError } = await db
    .from("bookings")
    .insert({
      booking_ref: bookingRef,
      facility_id: params.facilityId,
      society_id: SOCIETY_ID,
      package_id: params.packageId,
      customer_name: formValues.customerName,
      customer_email: formValues.customerEmail,
      customer_phone: formValues.customerPhone,
      is_resident: formValues.isResident,
      house_number: formValues.houseNumber ?? null,
      reference_resident: formValues.referenceResident ?? null,
      event_purpose: formValues.eventPurpose,
      guest_count: formValues.guestCount ?? null,
      booking_date: params.bookingDate,
      start_time: params.startTime ?? null,
      end_time: params.endTime ?? null,
      end_date: endDate,
      slot_type: params.slotType,
      base_amount: params.baseAmount,
      discount_amount: 0,
      total_amount: params.totalAmount,
      status: "awaiting_payment",
      expires_at: expiresAt,
    })
    .select("id, booking_ref, expires_at")
    .single();

  if (insertError || !booking) {
    console.error("[createBooking] insert error:", insertError);
    return { success: false, error: "Failed to create booking. Please try again." };
  }

  // 5. Temp reservation was already deleted before availability check above

  // 6. Fetch facility name for emails
  const { data: facility } = await db
    .from("facilities")
    .select("name")
    .eq("id", params.facilityId)
    .single();

  const facilityName = facility?.name ?? "Facility";

  // 7. Emails removed as per user request to save quota

  return {
    success: true,
    data: { bookingId: booking.id, bookingRef: booking.booking_ref, expiresAt },
  };
}

// ============================================================
// UPLOAD PAYMENT PROOF
// ============================================================

export async function uploadPaymentProof(params: {
  bookingId: string;
  paymentProofUrl: string;
  paymentPublicId: string;
  paymentReference: string;
}): Promise<ActionResult> {
  const db = createAdminClient();

  const { data: booking, error: fetchError } = await db
    .from("bookings")
    .select("id, booking_ref, status, expires_at, customer_email, customer_name, facility_id")
    .eq("id", params.bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found." };
  }

  // Check booking hasn't expired or been cancelled
  if (booking.status === "expired" || booking.status === "cancelled") {
    return { success: false, error: "This booking has expired or been cancelled." };
  }

  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    // Mark as expired
    await db.from("bookings").update({ status: "expired" }).eq("id", params.bookingId);
    return { success: false, error: "Your booking has expired. Please book again." };
  }

  const { error: updateError } = await db
    .from("bookings")
    .update({
      payment_proof_url: params.paymentProofUrl,
      payment_public_id: params.paymentPublicId,
      payment_reference: params.paymentReference,
      payment_uploaded_at: new Date().toISOString(),
      status: "pending_approval",
      expires_at: null, // clear the expiry once payment is submitted
    })
    .eq("id", params.bookingId);

  if (updateError) {
    console.error("[uploadPaymentProof]", updateError);
    return { success: false, error: "Failed to save payment details. Please try again." };
  }

  // Fetch facility name for emails
  const { data: facility } = await db
    .from("facilities")
    .select("name")
    .eq("id", booking.facility_id)
    .single();

  const facilityName = facility?.name ?? "Facility";

  // Emails removed as per user request to save quota

  return { success: true };
}

// ============================================================
// FETCH BOOKINGS (Admin)
// ============================================================

export async function getBookings(filters: BookingFilters = {}): Promise<
  ActionResult<{ bookings: Booking[]; total: number }>
> {
  const db = createAdminClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("bookings")
    .select("*, facility:facilities(id,name,slug,thumbnail_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.facilityId) {
    query = query.eq("facility_id", filters.facilityId);
  }
  if (filters.dateFrom) {
    query = query.gte("booking_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("booking_date", filters.dateTo);
  }
  if (filters.search) {
    query = query.or(
      `customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,booking_ref.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { bookings: (data ?? []) as unknown as Booking[], total: count ?? 0 } };
}

// ============================================================
// GET SINGLE BOOKING
// ============================================================

export async function getBookingById(id: string): Promise<ActionResult<Booking>> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("*, facility:facilities(id,name,slug,thumbnail_url), package:facility_packages(id,name,type)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Booking not found." };
  }
  return { success: true, data: data as unknown as Booking };
}

export async function getBookingByRef(ref: string): Promise<ActionResult<Booking>> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("*, facility:facilities(id,name,slug,thumbnail_url)")
    .eq("booking_ref", ref)
    .single();

  if (error || !data) {
    return { success: false, error: "Booking not found." };
  }
  return { success: true, data: data as unknown as Booking };
}

// ============================================================
// ADMIN: UPDATE BOOKING STATUS
// ============================================================

export async function updateBookingStatus(params: {
  bookingId: string;
  status: BookingStatus;
  adminNotes?: string;
  rejectionReason?: string;
}): Promise<ActionResult> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();

  // approved_by / cancelled_by have FK → admins(id).
  // Check if the logged-in user exists in admins; fall back to null if not seeded.
  const { data: adminRecord } = await db
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const adminId: string | null = adminRecord?.id ?? null;

  const update: Record<string, unknown> = {
    status: params.status,
    admin_notes: params.adminNotes ?? null,
  };

  if (params.status === "confirmed") {
    update.approved_by = adminId;
    update.approved_at = new Date().toISOString();
  }
  if (params.status === "rejected") {
    update.rejection_reason = params.rejectionReason ?? null;
  }
  if (params.status === "cancelled") {
    update.cancelled_by = adminId;
    update.cancelled_at = new Date().toISOString();
  }
  if (params.status === "completed") {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await db
    .from("bookings")
    .update(update)
    .eq("id", params.bookingId);

  if (error) return { success: false, error: error.message };

  // Send email notifications server-side (never from client)
  if (params.status === "confirmed" || params.status === "rejected") {
    const { data: bookingData } = await db
      .from("bookings")
      .select("customer_email, customer_name, booking_ref, booking_date, start_time, end_time, facility:facilities(name)")
      .eq("id", params.bookingId)
      .single();

    if (bookingData) {
      const facilityName = (bookingData as any).facility?.name ?? "Facility";
      if (params.status === "confirmed") {
        await sendBookingConfirmedEmail({
          to: bookingData.customer_email,
          name: bookingData.customer_name,
          bookingRef: bookingData.booking_ref,
          facilityName,
          bookingDate: bookingData.booking_date,
          startTime: bookingData.start_time ?? undefined,
          endTime: bookingData.end_time ?? undefined,
        }).catch((e) => console.error("[updateBookingStatus] confirm email:", e));
      }
      if (params.status === "rejected") {
        await sendBookingRejectedEmail({
          to: bookingData.customer_email,
          name: bookingData.customer_name,
          bookingRef: bookingData.booking_ref,
          facilityName,
          reason: params.rejectionReason,
        }).catch((e) => console.error("[updateBookingStatus] reject email:", e));
      }
    }
  }

  return { success: true };
}

// ============================================================
// EXPIRE STALE AWAITING_PAYMENT BOOKINGS (called by cron)
// ============================================================

export async function expireStaleBookings(): Promise<ActionResult<{ count: number }>> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .update({ status: "expired" })
    .eq("status", "awaiting_payment")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: { count: data?.length ?? 0 } };
}

// ============================================================
// GET AVAILABILITY for a facility on a date
// ============================================================

export async function getFacilityAvailability(params: {
  facilityId: string;
  dates: string[]; // array of "yyyy-MM-dd" strings
}): Promise<Record<string, "available" | "partial" | "booked">> {
  const db = createAdminClient();

  const minDate = params.dates[0];
  const maxDate = params.dates[params.dates.length - 1];

  const { data: bookings } = await db
    .from("bookings")
    .select("booking_date, end_date, slot_type, start_time, end_time, status")
    .eq("facility_id", params.facilityId)
    .not("status", "in", "(rejected,cancelled,expired)")
    .lte("booking_date", maxDate);

  const { data: tempRes } = await db
    .from("temporary_reservations")
    .select("booking_date, end_date, slot_type, start_time, end_time")
    .eq("facility_id", params.facilityId)
    .gt("expires_at", new Date().toISOString())
    .lte("booking_date", maxDate);

  const validBookings = [
    ...(bookings ?? []),
    ...(tempRes ?? [])
  ].filter((b: any) => {
    const bEnd = b.end_date || b.booking_date;
    return bEnd >= minDate;
  });

  const result: Record<string, "available" | "partial" | "booked"> = {};

  for (const date of params.dates) {
    const dayBookings = validBookings.filter((b: any) => {
      const bEnd = b.end_date || b.booking_date;
      return date >= b.booking_date && date <= bEnd;
    });

    if (dayBookings.length === 0) {
      result[date] = "available";
    } else if (
      dayBookings.some((b: any) =>
        ["half_day", "full_day", "monthly", "quarterly"].includes(b.slot_type)
      )
    ) {
      result[date] = "booked";
    } else {
      // For hourly — mark booked if 6+ slots taken (conservative threshold)
      result[date] = dayBookings.length >= 6 ? "booked" : "partial";
    }
  }

  return result;
}

// ============================================================
// GET BOOKED TIME SLOTS for a facility on a specific date
// ============================================================
export async function getBookedTimeSlots(params: {
  facilityId: string;
  date: string; // "yyyy-MM-dd"
}): Promise<{ start_time: string; end_time: string }[]> {
  const db = createAdminClient();

  const { data: bookings } = await db
    .from("bookings")
    .select("booking_date, end_date, start_time, end_time")
    .eq("facility_id", params.facilityId)
    .not("status", "in", "(rejected,cancelled,expired)")
    .lte("booking_date", params.date);

  const { data: tempRes } = await db
    .from("temporary_reservations")
    .select("booking_date, end_date, start_time, end_time")
    .eq("facility_id", params.facilityId)
    .gt("expires_at", new Date().toISOString())
    .lte("booking_date", params.date);

  const slots = [
    ...(bookings ?? []),
    ...(tempRes ?? []),
  ].filter((b: any) => {
    const bEnd = b.end_date || b.booking_date;
    return params.date >= b.booking_date && params.date <= bEnd && b.start_time && b.end_time;
  }) as { start_time: string; end_time: string }[];

  return slots;
}

// ============================================================
// DASHBOARD KPIs
// ============================================================

export async function getDashboardKPIs() {
  // Admin layout already ensures the user is authenticated before this is called.
  // We use the service-role admin client directly to bypass RLS and fetch real data.
  const db = createAdminClient();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  // Revenue counts confirmed + completed bookings (completed = event already happened)
  const [totalRevResult, monthRevResult, totalBookResult, pendingResult, upcomingResult] =
    await Promise.all([
      db
        .from("bookings")
        .select("total_amount")
        .in("status", ["confirmed", "completed"]),
      db
        .from("bookings")
        .select("total_amount")
        .in("status", ["confirmed", "completed"])
        .gte("booking_date", monthStart),
      db.from("bookings").select("id", { count: "exact", head: true }),
      db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval"),
      db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "completed"])
        .gte("booking_date", today),
    ]);

  // Log any errors so they appear in server/Vercel logs
  if (totalRevResult.error) console.error("[KPI] totalRev:", totalRevResult.error);
  if (monthRevResult.error) console.error("[KPI] monthRev:", monthRevResult.error);
  if (totalBookResult.error) console.error("[KPI] totalBook:", totalBookResult.error);
  if (pendingResult.error) console.error("[KPI] pending:", pendingResult.error);
  if (upcomingResult.error) console.error("[KPI] upcoming:", upcomingResult.error);

  const totalRevenue = (totalRevResult.data ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? 0),
    0
  );
  const monthlyRevenue = (monthRevResult.data ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? 0),
    0
  );

  // Most booked facility (exclude rejected/cancelled/expired)
  const { data: facilityBookings, error: facError } = await db
    .from("bookings")
    .select("facility_id, facilities(name)")
    .not("status", "in", "(rejected,cancelled,expired)");

  if (facError) console.error("[KPI] facilityBookings:", facError);

  const facilityCount: Record<string, { count: number; name: string }> = {};
  for (const b of facilityBookings ?? []) {
    const fid = b.facility_id;
    if (!facilityCount[fid]) {
      facilityCount[fid] = { count: 0, name: (b as any).facilities?.name ?? "" };
    }
    facilityCount[fid].count++;
  }

  const mostBooked = Object.values(facilityCount).sort((a, b) => b.count - a.count)[0];

  return {
    totalRevenue,
    monthlyRevenue,
    totalBookings: totalBookResult.count ?? 0,
    pendingApprovals: pendingResult.count ?? 0,
    upcomingBookings: upcomingResult.count ?? 0,
    occupancyRate: 0,
    mostBookedFacility: mostBooked?.name ?? null,
  };
}
