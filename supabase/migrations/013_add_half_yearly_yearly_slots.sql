-- ============================================================
-- MIGRATION 013: Add half_yearly and yearly slot types
-- ============================================================
-- Extends the slot type CHECK constraints on bookings and
-- facility_packages tables to include 'half_yearly' and 'yearly'.
-- Also updates check_slot_availability to treat them the same as
-- 'monthly' and 'quarterly' (multi-day, date-range + time overlap).
-- ============================================================

-- 1. Extend bookings.slot_type CHECK constraint
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_slot_type_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_slot_type_check
  CHECK (slot_type IN ('hourly', 'half_day', 'full_day', 'monthly', 'quarterly', 'half_yearly', 'yearly'));

-- 2. Extend facility_packages.type CHECK constraint
ALTER TABLE facility_packages
  DROP CONSTRAINT IF EXISTS facility_packages_type_check;

ALTER TABLE facility_packages
  ADD CONSTRAINT facility_packages_type_check
  CHECK (type IN ('hourly', 'half_day', 'full_day', 'monthly', 'quarterly', 'half_yearly', 'yearly'));

-- 3. Update check_slot_availability to treat half_yearly/yearly like monthly/quarterly
--    (multi-day slot-based: check date-range overlap AND time overlap)
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_facility_id  UUID,
  p_booking_date DATE,
  p_start_time   TIME,
  p_end_time     TIME,
  p_slot_type    TEXT,
  p_exclude_id   UUID    DEFAULT NULL,
  p_end_date     DATE    DEFAULT NULL,
  p_quantity     INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count  INTEGER;
  booked_quantity INTEGER;
  fac_inventory   INTEGER;
  fac_category    TEXT;
  req_start_date  DATE := p_booking_date;
  req_end_date    DATE := COALESCE(p_end_date, p_booking_date);
BEGIN

  SELECT category, inventory_count
    INTO fac_category, fac_inventory
    FROM facilities
   WHERE id = p_facility_id;

  -- ── ACCOMMODATION ─────────────────────────────────────────
  IF fac_category = 'accommodation' THEN

    SELECT COALESCE(SUM(b.quantity), 0)
      INTO booked_quantity
      FROM bookings b
     WHERE b.facility_id = p_facility_id
       AND b.status NOT IN ('rejected', 'cancelled', 'expired')
       AND NOT (b.status = 'awaiting_payment'
                AND b.expires_at IS NOT NULL
                AND b.expires_at < NOW())
       AND (p_exclude_id IS NULL OR b.id != p_exclude_id)
       AND b.booking_date  <= req_end_date
       AND COALESCE(b.end_date, b.booking_date) >= req_start_date;

    SELECT booked_quantity + COALESCE(SUM(tr.quantity), 0)
      INTO booked_quantity
      FROM temporary_reservations tr
     WHERE tr.facility_id = p_facility_id
       AND tr.expires_at  > NOW()
       AND tr.session_token != COALESCE(p_exclude_id::TEXT, '')
       AND tr.booking_date  <= req_end_date
       AND COALESCE(tr.end_date, tr.booking_date) >= req_start_date;

    RETURN (booked_quantity + p_quantity) <= fac_inventory;
  END IF;

  -- ── BLOCK-BASED (half_day, full_day) ─────────────────────
  IF p_slot_type IN ('half_day', 'full_day') THEN

    SELECT COUNT(*) INTO conflict_count
      FROM bookings
     WHERE facility_id = p_facility_id
       AND status NOT IN ('rejected', 'cancelled', 'expired')
       AND NOT (status = 'awaiting_payment'
                AND expires_at IS NOT NULL
                AND expires_at < NOW())
       AND (p_exclude_id IS NULL OR id != p_exclude_id)
       AND booking_date  <= req_end_date
       AND COALESCE(end_date, booking_date) >= req_start_date;

    IF conflict_count > 0 THEN RETURN FALSE; END IF;

    SELECT COUNT(*) INTO conflict_count
      FROM temporary_reservations
     WHERE facility_id   = p_facility_id
       AND expires_at    > NOW()
       AND session_token != COALESCE(p_exclude_id::TEXT, '')
       AND booking_date  <= req_end_date
       AND COALESCE(end_date, booking_date) >= req_start_date;

    RETURN conflict_count = 0;
  END IF;

  -- ── MULTI-DAY SLOT-BASED (monthly, quarterly, half_yearly, yearly) ──
  IF p_slot_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly') THEN

    SELECT COUNT(*) INTO conflict_count
      FROM bookings
     WHERE facility_id = p_facility_id
       AND status NOT IN ('rejected', 'cancelled', 'expired')
       AND NOT (status = 'awaiting_payment'
                AND expires_at IS NOT NULL
                AND expires_at < NOW())
       AND (p_exclude_id IS NULL OR id != p_exclude_id)
       AND booking_date  <= req_end_date
       AND COALESCE(end_date, booking_date) >= req_start_date
       AND (
         slot_type IN ('half_day', 'full_day')
         OR (
           slot_type IN ('hourly', 'monthly', 'quarterly', 'half_yearly', 'yearly')
           AND start_time < p_end_time
           AND end_time   > p_start_time
         )
       );

    IF conflict_count > 0 THEN RETURN FALSE; END IF;

    SELECT COUNT(*) INTO conflict_count
      FROM temporary_reservations
     WHERE facility_id   = p_facility_id
       AND expires_at    > NOW()
       AND session_token != COALESCE(p_exclude_id::TEXT, '')
       AND booking_date  <= req_end_date
       AND COALESCE(end_date, booking_date) >= req_start_date
       AND (
         slot_type IN ('half_day', 'full_day')
         OR (
           slot_type IN ('hourly', 'monthly', 'quarterly', 'half_yearly', 'yearly')
           AND start_time < p_end_time
           AND end_time   > p_start_time
         )
       );

    RETURN conflict_count = 0;
  END IF;

  -- ── HOURLY ───────────────────────────────────────────────
  SELECT COUNT(*) INTO conflict_count
    FROM bookings
   WHERE facility_id = p_facility_id
     AND status NOT IN ('rejected', 'cancelled', 'expired')
     AND NOT (status = 'awaiting_payment'
              AND expires_at IS NOT NULL
              AND expires_at < NOW())
     AND (p_exclude_id IS NULL OR id != p_exclude_id)
     AND booking_date  <= req_end_date
     AND COALESCE(end_date, booking_date) >= req_start_date
     AND (
       slot_type IN ('half_day', 'full_day')
       OR (
         slot_type IN ('hourly', 'monthly', 'quarterly', 'half_yearly', 'yearly')
         AND start_time < p_end_time
         AND end_time   > p_start_time
       )
     );

  IF conflict_count > 0 THEN RETURN FALSE; END IF;

  SELECT COUNT(*) INTO conflict_count
    FROM temporary_reservations
   WHERE facility_id   = p_facility_id
     AND expires_at    > NOW()
     AND session_token != COALESCE(p_exclude_id::TEXT, '')
     AND booking_date  <= req_end_date
     AND COALESCE(end_date, booking_date) >= req_start_date
     AND (
       slot_type IN ('half_day', 'full_day')
       OR (
         slot_type IN ('hourly', 'monthly', 'quarterly', 'half_yearly', 'yearly')
         AND start_time < p_end_time
         AND end_time   > p_start_time
       )
     );

  RETURN conflict_count = 0;

END;
$$ LANGUAGE plpgsql;

-- 4. Expire any currently stale awaiting_payment bookings so they stop
--    showing as booked in the UI immediately after running this migration.
UPDATE bookings
   SET status = 'expired'
 WHERE status = 'awaiting_payment'
   AND expires_at IS NOT NULL
   AND expires_at < NOW();
