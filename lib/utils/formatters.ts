import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BookingStatus } from "@/types/database";

/**
 * Merge Tailwind CSS classes safely (from ShadCN)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a large number with K/L abbreviations
 */
export function formatCompactNumber(num: number): string {
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Get display label + color for a booking status
 */
export function getStatusMeta(status: BookingStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const map: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
    awaiting_payment: {
      label: "Awaiting Payment",
      color: "text-amber-700",
      bgColor: "bg-amber-50 border-amber-200",
    },
    pending_approval: {
      label: "Pending Approval",
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-200",
    },
    confirmed: {
      label: "Confirmed",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 border-emerald-200",
    },
    rejected: {
      label: "Rejected",
      color: "text-red-700",
      bgColor: "bg-red-50 border-red-200",
    },
    cancelled: {
      label: "Cancelled",
      color: "text-stone-600",
      bgColor: "bg-stone-50 border-stone-200",
    },
    completed: {
      label: "Completed",
      color: "text-violet-700",
      bgColor: "bg-violet-50 border-violet-200",
    },
    expired: {
      label: "Expired",
      color: "text-stone-500",
      bgColor: "bg-stone-50 border-stone-200",
    },
  };
  return map[status] ?? { label: status, color: "text-stone-600", bgColor: "bg-stone-50 border-stone-200" };
}

/**
 * Generate a WhatsApp redirect URL with a pre-filled message
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/**
 * Truncate a string to a max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Generate a unique session token for temporary reservations
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Optimizes a Cloudinary URL to serve compressed, fast-loading formats (WebP/AVIF for images, optimized MP4 for videos).
 * This significantly speeds up Next.js Image component and <video> loading.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined): string {
  if (!url || !url.includes("res.cloudinary.com")) return url || "";
  if (url.includes("f_auto") || url.includes("q_auto")) return url;
  
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}
