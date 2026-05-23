import { Resend } from "resend";

// Lazily initialized — prevents build crash when env var not yet set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Resend] RESEND_API_KEY not set — emails will not be sent.");
      // Return a no-op stub so email calls don't throw
      return { emails: { send: async () => ({ data: null, error: null }) } } as unknown as Resend;
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "bookings@clubhouse.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";


// ============================================================
// USER EMAILS
// ============================================================

export async function sendBookingSubmittedEmail(params: {
  to: string;
  name: string;
  bookingRef: string;
  facilityName: string;
  bookingDate: string;
  totalAmount: number;
  expiresAt: string;
}) {
  const { to, name, bookingRef, facilityName, bookingDate, totalAmount, expiresAt } = params;
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Booking Received — ${bookingRef}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#8B6914;">Booking Received</h2>
        <p>Hi ${name},</p>
        <p>Your booking request has been received. Please complete payment within <strong>15 minutes</strong> to confirm your slot.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Booking Ref</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>${bookingRef}</strong></td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Facility</td><td style="padding:8px;border:1px solid #e5e7eb;">${facilityName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Date</td><td style="padding:8px;border:1px solid #e5e7eb;">${bookingDate}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Amount Due</td><td style="padding:8px;border:1px solid #e5e7eb;">₹${totalAmount.toLocaleString("en-IN")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Payment Deadline</td><td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;">${expiresAt}</td></tr>
        </table>
        <a href="${APP_URL}/booking/${bookingRef}/payment" style="display:inline-block;padding:12px 24px;background:#8B6914;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Complete Payment</a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px;">If you did not make this booking, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPaymentUploadedEmail(params: {
  to: string;
  name: string;
  bookingRef: string;
  facilityName: string;
}) {
  const { to, name, bookingRef, facilityName } = params;
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Payment Received — ${bookingRef} Under Review`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#8B6914;">Payment Under Review</h2>
        <p>Hi ${name},</p>
        <p>We have received your payment screenshot for <strong>${facilityName}</strong> (Ref: <strong>${bookingRef}</strong>).</p>
        <p>Our team will verify your payment and confirm your booking within 2–4 hours.</p>
        <p>You will receive another email once your booking is confirmed.</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmedEmail(params: {
  to: string;
  name: string;
  bookingRef: string;
  facilityName: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
}) {
  const { to, name, bookingRef, facilityName, bookingDate, startTime, endTime } = params;
  const timeStr = startTime ? `${startTime} – ${endTime}` : "Full day";
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `✅ Booking Confirmed — ${bookingRef}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#16a34a;">Booking Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Your booking has been <strong>confirmed</strong>. We look forward to hosting you.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Booking Ref</td><td style="padding:8px;border:1px solid #e5e7eb;"><strong>${bookingRef}</strong></td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Facility</td><td style="padding:8px;border:1px solid #e5e7eb;">${facilityName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Date</td><td style="padding:8px;border:1px solid #e5e7eb;">${bookingDate}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Time</td><td style="padding:8px;border:1px solid #e5e7eb;">${timeStr}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;">Please carry this email as proof of your booking.</p>
      </div>
    `,
  });
}

export async function sendBookingRejectedEmail(params: {
  to: string;
  name: string;
  bookingRef: string;
  facilityName: string;
  reason?: string;
}) {
  const { to, name, bookingRef, facilityName, reason } = params;
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Booking Update — ${bookingRef}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#dc2626;">Booking Not Approved</h2>
        <p>Hi ${name},</p>
        <p>Unfortunately, your booking for <strong>${facilityName}</strong> (Ref: ${bookingRef}) could not be approved.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>Please contact the clubhouse team for assistance or to re-book.</p>
      </div>
    `,
  });
}

// ============================================================
// ADMIN EMAILS
// ============================================================

export async function sendAdminNewBookingEmail(params: {
  to: string;
  bookingRef: string;
  customerName: string;
  facilityName: string;
  bookingDate: string;
  totalAmount: number;
}) {
  const { to, bookingRef, customerName, facilityName, bookingDate, totalAmount } = params;
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `New Booking Request — ${bookingRef}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#8B6914;">New Booking Request</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Ref</td><td style="padding:8px;border:1px solid #e5e7eb;">${bookingRef}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Customer</td><td style="padding:8px;border:1px solid #e5e7eb;">${customerName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Facility</td><td style="padding:8px;border:1px solid #e5e7eb;">${facilityName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Date</td><td style="padding:8px;border:1px solid #e5e7eb;">${bookingDate}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">Amount</td><td style="padding:8px;border:1px solid #e5e7eb;">₹${totalAmount.toLocaleString("en-IN")}</td></tr>
        </table>
        <a href="${APP_URL}/dashboard/bookings/${bookingRef}" style="display:inline-block;padding:12px 24px;background:#8B6914;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">View in Dashboard</a>
      </div>
    `,
  });
}

export async function sendAdminPaymentUploadedEmail(params: {
  to: string;
  bookingRef: string;
  customerName: string;
  facilityName: string;
}) {
  const { to, bookingRef, customerName, facilityName } = params;
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⚡ Payment Proof Uploaded — ${bookingRef} Needs Approval`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <h2 style="color:#d97706;">Action Required: Payment Verification</h2>
        <p><strong>${customerName}</strong> has uploaded payment proof for booking <strong>${bookingRef}</strong> (${facilityName}).</p>
        <p>Please verify the payment and approve or reject the booking.</p>
        <a href="${APP_URL}/dashboard/bookings" style="display:inline-block;padding:12px 24px;background:#8B6914;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Go to Approval Queue</a>
      </div>
    `,
  });
}
