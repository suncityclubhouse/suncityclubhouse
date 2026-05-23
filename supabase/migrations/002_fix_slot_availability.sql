-- Run this in Supabase SQL Editor to fix the slot availability check.
-- The original function allowed hourly bookings even when a full_day/half_day slot existed.

CREATE OR REPLACE FUNCTION check_slot_availability(
  p_facility_id  UUID,
  p_booking_date DATE,
  p_start_time   TIME,
  p_end_time     TIME,
  p_slot_type    TEXT,
  p_exclude_id   UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- 1. If booking a full-day type, block if ANY active booking exists on that date
  IF p_slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly') THEN
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE facility_id = p_facility_id
      AND booking_date = p_booking_date
      AND status NOT IN ('rejected', 'cancelled', 'expired')
      AND (p_exclude_id IS NULL OR id != p_exclude_id);

    RETURN conflict_count = 0;
  END IF;

  -- 2. For hourly: first check if any full-day/half-day booking blocks the date
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND status NOT IN ('rejected', 'cancelled', 'expired')
    AND slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly')
    AND (p_exclude_id IS NULL OR id != p_exclude_id);

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- 3. For hourly: check time-overlap with other hourly bookings
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND status NOT IN ('rejected', 'cancelled', 'expired')
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND start_time < p_end_time
    AND end_time > p_start_time;

  -- 4. Also check temporary reservations for time overlap
  SELECT conflict_count + COUNT(*) INTO conflict_count
  FROM temporary_reservations
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND expires_at > NOW()
    AND start_time < p_end_time
    AND end_time > p_start_time;

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
