-- ============================================================
-- MIGRATION 015: Add payment_mode to bookings
-- ============================================================
-- Adds a payment_mode column to the bookings table so admins can
-- record how a resident actually paid (UPI, Cash, Cheque, etc.)
-- This is especially important for manual/cash bookings where there
-- is no payment screenshot but we still need a proper paper trail.
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_mode TEXT
    CHECK (payment_mode IN ('upi', 'cash', 'cheque', 'bank_transfer', 'other'))
    DEFAULT NULL;

COMMENT ON COLUMN bookings.payment_mode IS
  'How the resident paid: upi | cash | cheque | bank_transfer | other.
   Set by admin when confirming a booking.';
