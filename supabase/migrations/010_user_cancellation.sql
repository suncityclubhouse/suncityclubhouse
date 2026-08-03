-- ============================================================
-- USER CANCELLATION + ADMIN BOOKING SUPPORT
-- ============================================================
-- Run in Supabase SQL Editor → Dashboard → SQL Editor

-- 1. Track whether a booking was cancelled by the user (self-service)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancelled_by_user BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Store cancellation reason / refund tier applied
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 3. Track refund amount (what the user should receive back)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2);

-- 4. Payment type for admin-created bookings (upi = normal flow, others = manual)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'upi'
    CHECK (payment_type IN ('upi', 'cash', 'complimentary', 'deferred'));

-- 5. Flag to identify admin-created manual bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_admin_booking BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for filtering admin vs public bookings
CREATE INDEX IF NOT EXISTS idx_bookings_is_admin ON bookings(is_admin_booking);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by_user ON bookings(cancelled_by_user);
