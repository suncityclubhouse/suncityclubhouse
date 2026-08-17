-- Migration: Add is_gst_inclusive to bookings + backfill existing GST data
-- ============================================================================

-- 1. Add is_gst_inclusive column (defaults to true for existing bookings)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_gst_inclusive boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN bookings.is_gst_inclusive IS 'true = price includes GST; false = GST added on top';

-- 2. Backfill: 7 Deluxe Rooms booking (5% GST Exclusive)
--    - base_amount = 10500, total_amount = 11025
--    - CGST 2.5% = 262.50, SGST 2.5% = 262.50
UPDATE bookings
SET
  gst_percentage   = 5,
  cgst_amount      = 262.50,
  sgst_amount      = 262.50,
  is_gst_inclusive  = false
WHERE base_amount = 10500
  AND total_amount = 11025
  AND quantity = 7
  AND status IN ('confirmed', 'completed');

-- 3. Backfill: Sanju Motwani Badminton Court (18% GST Inclusive in 200/hr)
--    - total_amount stays as-is (200 per hour x quantity)
--    - base_amount = total / 1.18, CGST = GST/2, SGST = GST/2
UPDATE bookings
SET
  gst_percentage   = 18,
  base_amount      = ROUND(total_amount / 1.18, 2),
  cgst_amount      = ROUND((total_amount - ROUND(total_amount / 1.18, 2)) / 2, 2),
  sgst_amount      = ROUND((total_amount - ROUND(total_amount / 1.18, 2)) / 2, 2),
  is_gst_inclusive  = true
WHERE customer_name ILIKE '%sanju motv%'
  AND status IN ('confirmed', 'completed');
