const phoneId = process.env.META_WHATSAPP_PHONE_ID;
const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

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
  slotType?: string;
}) {
  if (!phoneId || !accessToken) {
    console.warn("[WhatsApp] Meta API credentials missing. Message not sent.");
    return false;
  }

  // Meta Cloud API requires the country code without '+' or 'whatsapp:' prefix
  let toPhone = params.phone.replace(/\D/g, "");
  if (toPhone.length === 10) {
    toPhone = `91${toPhone}`;
  }

  let durationLine = "";
  if (params.slotType === "hourly" && params.startTime && params.endTime) {
    durationLine = ` | ${formatTime(params.startTime)} – ${formatTime(params.endTime)}`;
  } else if (params.slotType && params.slotType !== "hourly") {
    // Format "half_yearly" -> "Half Yearly", "monthly" -> "Monthly"
    const formattedSlot = params.slotType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    durationLine = ` (${formattedSlot})`;
  } else if (!params.slotType && params.startTime && params.endTime) {
    // Fallback if slotType is not provided but times are
    durationLine = ` | ${formatTime(params.startTime)} – ${formatTime(params.endTime)}`;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone,
        type: "template",
        template: {
          name: "booking_confirmed",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: params.name },
                { type: "text", text: params.bookingRef },
                { type: "text", text: params.facilityName },
                { type: "text", text: params.date.split("-").reverse().join("-") + durationLine },
                { type: "text", text: params.amount }
              ]
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp] Meta API Error:", data);
      return false;
    }

    console.log(`[WhatsApp] Sent confirmation to ${params.phone}, Msg ID: ${data.messages?.[0]?.id}`);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return false;
  }
}
