import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/** Format a 24-hr HH:MM string to 12-hr AM/PM. */
function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export async function sendBookingConfirmedWhatsApp(params: {
  phone: string;
  name: string;
  bookingRef: string;
  facilityName: string;
  date: string;
  amount: string;
  startTime?: string;
  endTime?: string;
}) {
  if (!client) {
    console.warn("[WhatsApp] Twilio credentials missing. Message not sent.");
    return false;
  }

  // Twilio requires numbers to be in E.164 format.
  // Assuming Indian numbers, we prepend +91 if not present.
  let toPhone = params.phone.replace(/\D/g, "");
  if (toPhone.length === 10) {
    toPhone = `91${toPhone}`;
  }

  const timeLine =
    params.startTime && params.endTime
      ? `\n⏰ Time: ${formatTime(params.startTime)} – ${formatTime(params.endTime)}`
      : "";

  const messageBody = `Hello ${params.name}, your booking at Sun City Clubhouse is CONFIRMED! 🎉

📋 Booking Ref: ${params.bookingRef}
🏛️ Facility: ${params.facilityName}
📅 Date: ${params.date}${timeLine}
💰 Amount: ₹${params.amount}

For any queries, contact us at the clubhouse office.`;

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to: `whatsapp:+${toPhone}`,
    });
    console.log(`[WhatsApp] Sent confirmation to ${params.phone}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return false;
  }
}
