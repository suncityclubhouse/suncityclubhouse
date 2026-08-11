-- ============================================================
-- MIGRATION 014: Fix half_day time overlaps
-- ============================================================
-- Previously, half_day bookings were grouped with full_day
-- bookings, meaning a half_day booking would block the entire
-- calendar date and ignore its specific start_time and end_time.
-- This migration moves half_day out of the "Block-Based" category
-- and into the "Time-Based" category, allowing Morning and Evening
-- half-day bookings to coexist on the same date.
-- ============================================================

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

  -- ── ACCOMMODATION (Inventory-Aware) ──────────────────────
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

  -- ── BLOCK-BASED (full_day only) ──────────────────────────
  -- full_day blocks everything on that date, regardless of time.
  IF p_slot_type = 'full_day' THEN

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
  -- Checks date range AND time overlap.
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
         slot_type = 'full_day'
         OR (
           slot_type IN ('hourly', 'half_day', 'monthly', 'quarterly', 'half_yearly', 'yearly')
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
         slot_type = 'full_day'
         OR (
           slot_type IN ('hourly', 'half_day', 'monthly', 'quarterly', 'half_yearly', 'yearly')
           AND start_time < p_end_time
           AND end_time   > p_start_time
         )
       );

    RETURN conflict_count = 0;
  END IF;

  -- ── TIME-BASED (hourly, half_day) ────────────────────────
  -- Checks time overlap on the specified date(s).
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
       slot_type = 'full_day'
       OR (
         slot_type IN ('hourly', 'half_day', 'monthly', 'quarterly', 'half_yearly', 'yearly')
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
       slot_type = 'full_day'
       OR (
         slot_type IN ('hourly', 'half_day', 'monthly', 'quarterly', 'half_yearly', 'yearly')
         AND start_time < p_end_time
         AND end_time   > p_start_time
       )
     );

  RETURN conflict_count = 0;

END;
$$ LANGUAGE plpgsql;
