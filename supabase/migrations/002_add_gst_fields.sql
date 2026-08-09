-- ============================================================
-- MIGRATION 002 — GST fields + expanded slot types
-- Run this in your Supabase SQL editor after 001_initial_schema.sql
-- ============================================================

-- 1. Add GST configuration columns to facility_packages
--    gst_percentage: 0, 5, or 18
--    is_gst_inclusive: TRUE = price already includes GST; FALSE = GST is added on top
ALTER TABLE facility_packages
  ADD COLUMN IF NOT EXISTS gst_percentage   NUMERIC(5,2) NOT NULL DEFAULT 0
                                             CHECK (gst_percentage IN (0, 5, 18)),
  ADD COLUMN IF NOT EXISTS is_gst_inclusive BOOLEAN      NOT NULL DEFAULT TRUE;

-- 2. Add GST breakdown columns to bookings (for historical accuracy on invoices)
--    gst_percentage: rate applied at booking time
--    cgst_amount: half of total GST (CGST)
--    sgst_amount: half of total GST (SGST)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount    NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 3. Expand slot_type CHECK constraint to include half_yearly and yearly
--    We must drop and recreate the constraint.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_slot_type_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_slot_type_check
  CHECK (slot_type IN (
    'hourly', 'half_day', 'full_day',
    'monthly', 'quarterly', 'half_yearly', 'yearly'
  ));

-- 4. Expand facility_packages type CHECK constraint similarly
ALTER TABLE facility_packages
  DROP CONSTRAINT IF EXISTS facility_packages_type_check;

ALTER TABLE facility_packages
  ADD CONSTRAINT facility_packages_type_check
  CHECK (type IN (
    'hourly', 'half_day', 'full_day',
    'monthly', 'quarterly', 'half_yearly', 'yearly'
  ));
