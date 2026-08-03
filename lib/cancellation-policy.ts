/**
 * Cancellation Policy Configuration
 *
 * Defines refund tiers based on how many days before the booking
 * the cancellation is requested.
 *
 * Update this file once you have the manager's per-facility policies.
 * For now this is a single global policy applied to all facilities.
 *
 * Each tier:
 *  - minDays: minimum days before booking (inclusive)
 *  - maxDays: maximum days before booking (inclusive), null = no upper limit
 *  - deductionPercent: % of total_amount to deduct (0 = full refund, 100 = no refund)
 *  - label: human-readable description shown to the user
 */

export interface CancellationTier {
  minDays: number;
  maxDays: number | null;
  deductionPercent: number;
  label: string;
}

/**
 * Global default cancellation policy.
 * Tiers are checked from most-restrictive to least-restrictive.
 */
export const DEFAULT_CANCELLATION_POLICY: CancellationTier[] = [
  {
    minDays: 7,
    maxDays: null,
    deductionPercent: 0,
    label: "Full refund — cancelled 7 or more days before the event",
  },
  {
    minDays: 3,
    maxDays: 6,
    deductionPercent: 25,
    label: "25% cancellation charge — cancelled 3–6 days before the event",
  },
  {
    minDays: 1,
    maxDays: 2,
    deductionPercent: 50,
    label: "50% cancellation charge — cancelled 1–2 days before the event",
  },
  {
    minDays: 0,
    maxDays: 0,
    deductionPercent: 100,
    label: "No refund — cancelled on the day of the event or after",
  },
];

/**
 * Calculate the refund details for a cancellation.
 *
 * @param bookingDate - ISO date string "yyyy-MM-dd" of the booking
 * @param totalAmount - total amount paid
 * @param policy - cancellation policy tiers to use (defaults to global policy)
 * @returns refund calculation result
 */
export function calculateCancellationRefund(
  bookingDate: string,
  totalAmount: number,
  policy: CancellationTier[] = DEFAULT_CANCELLATION_POLICY
): {
  daysUntilBooking: number;
  deductionPercent: number;
  deductionAmount: number;
  refundAmount: number;
  label: string;
  tier: CancellationTier;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const booking = new Date(bookingDate);
  booking.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilBooking = Math.floor((booking.getTime() - today.getTime()) / msPerDay);

  // Find the matching tier (clamp to 0 for past dates)
  const effectiveDays = Math.max(0, daysUntilBooking);

  const tier =
    policy.find(
      (t) =>
        effectiveDays >= t.minDays &&
        (t.maxDays === null || effectiveDays <= t.maxDays)
    ) ?? policy[policy.length - 1]; // fallback to most restrictive

  const deductionAmount = Math.round((totalAmount * tier.deductionPercent) / 100);
  const refundAmount = totalAmount - deductionAmount;

  return {
    daysUntilBooking: effectiveDays,
    deductionPercent: tier.deductionPercent,
    deductionAmount,
    refundAmount,
    label: tier.label,
    tier,
  };
}
