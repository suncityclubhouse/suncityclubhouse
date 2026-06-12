-- Fix: exclude awaiting_payment bookings whose expires_at has lapsed
-- from slot availability checks. Previously these stale bookings permanently
-- blocked slots even after the 15-minute payment window expired.

DROP FUNCTION IF EXISTS check_slot_availability;

CREATE OR REPLACE FUNCTION check_slot_availability(
  p_facility_id  UUID,
  p_booking_date DATE,
  p_start_time   TIME,
  p_end_time     TIME,
  p_slot_type    TEXT,
  p_exclude_id   UUID DEFAULT NULL,
  p_end_date     DATE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
  req_start_date DATE := p_booking_date;
  req_end_date   DATE := COALESCE(p_end_date, p_booking_date);
BEGIN
  -- Active booking statuses: anything that is NOT rejected/cancelled/expired
  -- AND is NOT an awaiting_payment booking whose payment window has lapsed.
  -- We treat lapsed awaiting_payment as effectively expired for slot availability.

  -- If the INCOMING booking is block-based (half_day, full_day):
  -- It conflicts if ANY "live" booking overlaps in date range.
  IF p_slot_type IN ('half_day', 'full_day') THEN
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE facility_id = p_facility_id
      AND status NOT IN ('rejected', 'cancelled', 'expired')
      -- Exclude lapsed awaiting_payment bookings
      AND NOT (status = 'awaiting_payment' AND expires_at IS NOT NULL AND expires_at < NOW())
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND booking_date <= req_end_date
      AND COALESCE(end_date, booking_date) >= req_start_date;

    IF conflict_count > 0 THEN
      RETURN FALSE;
    END IF;

    -- Check temporary reservations
    SELECT COUNT(*) INTO conflict_count
    FROM temporary_reservations
    WHERE facility_id = p_facility_id
      AND expires_at > NOW()
      AND session_token != COALESCE(p_exclude_id::text, '')
      AND booking_date <= req_end_date
      AND COALESCE(end_date, booking_date) >= req_start_date;

    RETURN conflict_count = 0;
  END IF;

  -- If the INCOMING booking is slot-based (hourly, monthly, quarterly):
  -- Check A: block-based bookings conflict by date overlap
  -- Check B: slot-based bookings conflict by date AND time overlap

  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND status NOT IN ('rejected', 'cancelled', 'expired')
    -- Exclude lapsed awaiting_payment bookings
    AND NOT (status = 'awaiting_payment' AND expires_at IS NOT NULL AND expires_at < NOW())
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND booking_date <= req_end_date
    AND COALESCE(end_date, booking_date) >= req_start_date
    AND (
      -- Case A: Block-based booking overlaps in date
      slot_type IN ('half_day', 'full_day')
      OR
      -- Case B: Slot-based booking overlaps in date AND overlaps in time
      (
        slot_type IN ('hourly', 'monthly', 'quarterly')
        AND start_time < p_end_time
        AND end_time > p_start_time
      )
    );

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- Check temporary reservations (slot-based)
  SELECT COUNT(*) INTO conflict_count
  FROM temporary_reservations
  WHERE facility_id = p_facility_id
    AND expires_at > NOW()
    AND session_token != COALESCE(p_exclude_id::text, '')
    AND booking_date <= req_end_date
    AND COALESCE(end_date, booking_date) >= req_start_date
    AND (
      slot_type IN ('half_day', 'full_day')
      OR
      (
        slot_type IN ('hourly', 'monthly', 'quarterly')
        AND start_time < p_end_time
        AND end_time > p_start_time
      )
    );

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
