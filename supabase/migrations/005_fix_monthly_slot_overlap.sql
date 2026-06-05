-- Fix slot availability check to properly handle slot-based bookings (hourly, monthly, quarterly)
-- by checking time overlaps instead of blocking the entire day/month.

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
  -- We distinguish between:
  -- 1. Block-based bookings (half_day, full_day):
  --    They block the entire court for the whole date range (start_date to end_date).
  -- 2. Slot-based bookings (hourly, monthly, quarterly):
  --    They block a specific time range (start_time to end_time) on the days within their date range.

  -- If the INCOMING booking is block-based (half_day, full_day):
  -- It conflicts if ANY existing booking (slot-based or block-based) overlaps in date range.
  IF p_slot_type IN ('half_day', 'full_day') THEN
    -- Check bookings
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE facility_id = p_facility_id
      AND status NOT IN ('rejected', 'cancelled', 'expired')
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
  -- It conflicts if:
  -- A) Any block-based booking overlaps in date range, OR
  -- B) Any slot-based booking overlaps in date range AND overlaps in time slot.
  
  -- Check A & B against bookings
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND status NOT IN ('rejected', 'cancelled', 'expired')
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

  -- Check A & B against temporary reservations
  SELECT COUNT(*) INTO conflict_count
  FROM temporary_reservations
  WHERE facility_id = p_facility_id
    AND expires_at > NOW()
    AND session_token != COALESCE(p_exclude_id::text, '')
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

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
