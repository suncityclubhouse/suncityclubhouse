-- ============================================================
-- MIGRATION 012: Fix check_slot_availability — consolidate all
-- previous fixes that were lost when migration 009 rewrote the
-- function from scratch.
--
-- Problems fixed:
--   1. Migration 009 lost the lapsed-payment exclusion from 006.
--      awaiting_payment bookings whose 15-min window expired were
--      blocking slots again.
--   2. Migration 009 used `booking_date = p_booking_date` for
--      monthly/quarterly checks, ignoring end_date. A monthly
--      booking (Aug 1–31) did not block Aug 15.
--   3. The accommodation path did not exclude lapsed payments either.
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

  -- Fetch facility meta once
  SELECT category, inventory_count
    INTO fac_category, fac_inventory
    FROM facilities
   WHERE id = p_facility_id;

  -- ─────────────────────────────────────────────────────────
  -- ACCOMMODATION: inventory-aware (sum quantities)
  -- ─────────────────────────────────────────────────────────
  IF fac_category = 'accommodation' THEN

    SELECT COALESCE(SUM(b.quantity), 0)
      INTO booked_quantity
      FROM bookings b
     WHERE b.facility_id = p_facility_id
       AND b.status NOT IN ('rejected', 'cancelled', 'expired')
       -- Exclude lapsed awaiting_payment bookings (fix from migration 006)
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
       -- Exclude the caller's own reservation token
       AND tr.session_token != COALESCE(p_exclude_id::TEXT, '')
       AND tr.booking_date  <= req_end_date
       AND COALESCE(tr.end_date, tr.booking_date) >= req_start_date;

    RETURN (booked_quantity + p_quantity) <= fac_inventory;
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- BLOCK-BASED incoming booking (half_day, full_day):
  -- Conflicts with ANY booking or temp-reservation that
  -- overlaps the requested date range.
  -- ─────────────────────────────────────────────────────────
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

    IF conflict_count > 0 THEN
      RETURN FALSE;
    END IF;

    SELECT COUNT(*) INTO conflict_count
      FROM temporary_reservations
     WHERE facility_id   = p_facility_id
       AND expires_at    > NOW()
       AND session_token != COALESCE(p_exclude_id::TEXT, '')
       AND booking_date  <= req_end_date
       AND COALESCE(end_date, booking_date) >= req_start_date;

    RETURN conflict_count = 0;
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- MULTI-DAY SLOT-BASED (monthly, quarterly):
  -- Conflicts with:
  --   A) any block-based booking in the overlapping date range
  --   B) any slot-based booking in the overlapping date range
  --      AND overlapping time window
  -- ─────────────────────────────────────────────────────────
  IF p_slot_type IN ('monthly', 'quarterly') THEN

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
           slot_type IN ('hourly', 'monthly', 'quarterly')
           AND start_time < p_end_time
           AND end_time   > p_start_time
         )
       );

    IF conflict_count > 0 THEN
      RETURN FALSE;
    END IF;

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
           slot_type IN ('hourly', 'monthly', 'quarterly')
           AND start_time < p_end_time
           AND end_time   > p_start_time
         )
       );

    RETURN conflict_count = 0;
  END IF;

  -- ─────────────────────────────────────────────────────────
  -- HOURLY incoming booking:
  -- Conflicts with block-based (same date range) OR
  -- hourly/monthly/quarterly with overlapping time on same date.
  -- ─────────────────────────────────────────────────────────
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
         slot_type IN ('hourly', 'monthly', 'quarterly')
         AND start_time < p_end_time
         AND end_time   > p_start_time
       )
     );

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

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
         slot_type IN ('hourly', 'monthly', 'quarterly')
         AND start_time < p_end_time
         AND end_time   > p_start_time
       )
     );

  RETURN conflict_count = 0;

END;
$$ LANGUAGE plpgsql;
