-- ============================================================
-- Migration 011: Unique UTR / payment_reference enforcement
-- ============================================================
-- A UTR (Unique Transaction Reference) is assigned by NPCI for every
-- single UPI transaction and is globally unique across India's entire
-- banking network. Enforcing uniqueness here prevents:
--   1. Accidental re-submission of the same payment screenshot
--   2. Fraudulent use of one payment to confirm multiple bookings
--
-- We use a PARTIAL unique index rather than a full column constraint so
-- that:
--   - NULL values are allowed (pre-payment rows have no UTR yet)
--   - Rejected / cancelled / expired bookings are excluded from the check
--     (if a booking is rejected the UTR is "freed" so the user can
--      re-submit for a new booking without issues)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_payment_reference
  ON bookings (UPPER(TRIM(payment_reference)))
  WHERE payment_reference IS NOT NULL
    AND status NOT IN ('expired', 'rejected', 'cancelled');

-- Add a helpful comment on the column for future developers
COMMENT ON COLUMN bookings.payment_reference IS
  'UTR / UPI Transaction Reference Number submitted by the customer. '
  'Enforced unique (case-insensitive) across active/confirmed bookings '
  'via partial index uq_bookings_payment_reference.';
