/**
 * GST Calculation Utilities
 *
 * Indian GST for clubhouse bookings splits into CGST and SGST (each = half of total GST rate).
 *   - 5%  → CGST 2.5% + SGST 2.5%
 *   - 18% → CGST 9%   + SGST 9%
 *
 * Inclusive:  the entered price already contains GST. We extract the tax from it.
 *             taxableBase = total / (1 + gstRate/100)
 *             totalGst    = total - taxableBase
 *
 * Exclusive:  the entered price is pre-tax. GST is added on top.
 *             taxableBase = enteredPrice
 *             totalGst    = enteredPrice * (gstRate / 100)
 *             grandTotal  = enteredPrice + totalGst
 */

export type GstRate = 0 | 5 | 18;

export interface GstBreakdown {
  /** The taxable base amount (pre-GST) */
  baseAmount: number;
  /** CGST amount (half of total GST) */
  cgstAmount: number;
  /** SGST amount (half of total GST) */
  sgstAmount: number;
  /** Total GST = cgst + sgst */
  totalGst: number;
  /** Final payable amount = baseAmount + totalGst */
  grandTotal: number;
  /** GST rate percentage (0, 5, or 18) */
  gstPercentage: GstRate;
  /** Whether the input amount was inclusive or exclusive */
  isInclusive: boolean;
}

/**
 * Calculate CGST, SGST, and totals given an amount, rate, and inclusive/exclusive flag.
 *
 * @param amount        - The entered amount (inclusive or exclusive of GST depending on flag)
 * @param gstRate       - 0, 5, or 18
 * @param isInclusive   - true = amount includes GST; false = GST is added on top
 */
export function calcGst(
  amount: number,
  gstRate: GstRate,
  isInclusive: boolean
): GstBreakdown {
  if (gstRate === 0 || amount <= 0) {
    return {
      baseAmount: round2(amount),
      cgstAmount: 0,
      sgstAmount: 0,
      totalGst: 0,
      grandTotal: round2(amount),
      gstPercentage: 0,
      isInclusive,
    };
  }

  let baseAmount: number;
  let totalGst: number;
  let grandTotal: number;

  if (isInclusive) {
    // Extract GST from the inclusive price
    grandTotal = amount;
    baseAmount = amount / (1 + gstRate / 100);
    totalGst = grandTotal - baseAmount;
  } else {
    // Add GST on top of the exclusive price
    baseAmount = amount;
    totalGst = amount * (gstRate / 100);
    grandTotal = amount + totalGst;
  }

  const cgstAmount = totalGst / 2;
  const sgstAmount = totalGst / 2;

  return {
    baseAmount: round2(baseAmount),
    cgstAmount: round2(cgstAmount),
    sgstAmount: round2(sgstAmount),
    totalGst: round2(totalGst),
    grandTotal: round2(grandTotal),
    gstPercentage: gstRate,
    isInclusive,
  };
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Returns CGST/SGST rate label (half of total GST rate).
 * e.g. 18% → "9%"
 */
export function halfRate(gstRate: GstRate): string {
  return `${gstRate / 2}%`;
}

/**
 * Build a display-ready GST breakdown array for UI rendering.
 * Returns empty array when there is no GST.
 */
export function getGstBreakdownLines(breakdown: GstBreakdown): Array<{
  label: string;
  amount: number;
}> {
  if (breakdown.gstPercentage === 0 || breakdown.totalGst === 0) return [];

  const half = breakdown.gstPercentage / 2;
  return [
    { label: `CGST ${half}%`, amount: breakdown.cgstAmount },
    { label: `SGST ${half}%`, amount: breakdown.sgstAmount },
    { label: `Total GST`, amount: breakdown.totalGst },
  ];
}
