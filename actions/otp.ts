"use server";

import type { ActionResult } from "@/types";

const API_KEY = process.env.TWO_FACTOR_API_KEY;

export async function sendOtp(phone: string): Promise<ActionResult<{ sessionId: string }>> {
  if (!API_KEY) return { success: false, error: "2Factor API key missing in .env.local" };
  if (!phone || phone.length !== 10) return { success: false, error: "Invalid 10-digit mobile number." };

  try {
    const res = await fetch(`https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN`, {
      method: "GET"
    });
    const data = await res.json();
    
    if (data.Status !== "Success") {
      return { success: false, error: "Failed to send OTP via 2Factor." };
    }
    
    return { success: true, data: { sessionId: data.Details } };
  } catch (error) {
    console.error("[sendOtp] Error:", error);
    return { success: false, error: "Failed to connect to 2Factor." };
  }
}

export async function verifyOtp(sessionId: string, otp: string): Promise<ActionResult> {
  if (!API_KEY) return { success: false, error: "2Factor API key missing." };
  if (!otp || otp.length < 4) return { success: false, error: "Invalid OTP." };
  if (!sessionId) return { success: false, error: "Session ID missing." };

  try {
    const res = await fetch(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`, {
      method: "GET"
    });
    const data = await res.json();
    
    if (data.Status !== "Success") {
      return { success: false, error: data.Details || "Invalid or expired OTP." };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[verifyOtp] Error:", error);
    return { success: false, error: "Failed to connect to 2Factor verification." };
  }
}

export async function resendOtp(phone: string): Promise<ActionResult<{ sessionId: string }>> {
  // 2Factor resend is essentially calling the AUTOGEN route again
  return sendOtp(phone);
}
