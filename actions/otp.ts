"use server";

import type { ActionResult } from "@/types";

const API_KEY = process.env.FAST2SMS_API_KEY;
const OTP_ID = process.env.FAST2SMS_OTP_ID; // Fast2SMS Smart OTP Template ID

export async function sendOtp(phone: string): Promise<ActionResult> {
  if (!API_KEY || !OTP_ID) return { success: false, error: "OTP service not configured. Please add FAST2SMS keys in .env.local" };
  if (!phone || phone.length !== 10) return { success: false, error: "Invalid 10-digit mobile number." };

  try {
    const res = await fetch("https://www.fast2sms.com/dev/otp/send", {
      method: "POST",
      headers: {
        "authorization": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile: phone,
        otp_id: OTP_ID,
        otp_expiry: 5,
        otp_length: 6,
      })
    });
    const data = await res.json();
    
    if (!res.ok || !data.return) {
      return { success: false, error: data.message || "Failed to send OTP via Fast2SMS." };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[sendOtp] Error:", error);
    return { success: false, error: "Failed to connect to Fast2SMS." };
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<ActionResult> {
  if (!API_KEY) return { success: false, error: "OTP service not configured." };
  if (!otp || otp.length < 4) return { success: false, error: "Invalid OTP." };

  try {
    const res = await fetch("https://www.fast2sms.com/dev/otp/verify", {
      method: "POST",
      headers: {
        "authorization": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile: phone,
        otp: otp
      })
    });
    const data = await res.json();
    
    if (!res.ok || !data.return) {
      return { success: false, error: data.message || "Invalid or expired OTP." };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[verifyOtp] Error:", error);
    return { success: false, error: "Failed to connect to Fast2SMS verification." };
  }
}

export async function resendOtp(phone: string): Promise<ActionResult> {
  if (!API_KEY) return { success: false, error: "OTP service not configured." };

  try {
    const res = await fetch("https://www.fast2sms.com/dev/otp/resend", {
      method: "POST",
      headers: {
        "authorization": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mobile: phone })
    });
    const data = await res.json();
    
    if (!res.ok || !data.return) {
      return { success: false, error: data.message || "Failed to resend OTP." };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[resendOtp] Error:", error);
    return { success: false, error: "Failed to connect to Fast2SMS." };
  }
}
