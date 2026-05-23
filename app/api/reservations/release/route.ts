import { releaseExpiredReservations } from "@/actions/reservations";
import { expireStaleBookings } from "@/actions/bookings";
import { NextResponse } from "next/server";

/**
 * Vercel Cron Job endpoint — runs every 5 minutes.
 * Cleans up expired temporary reservations and stale bookings.
 *
 * Protect with CRON_SECRET to prevent unauthorized calls.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reservationsResult, bookingsResult] = await Promise.all([
    releaseExpiredReservations(),
    expireStaleBookings(),
  ]);

  return NextResponse.json({
    success: true,
    reservationsReleased: reservationsResult.data?.count ?? 0,
    bookingsExpired: bookingsResult.data?.count ?? 0,
    timestamp: new Date().toISOString(),
  });
}
