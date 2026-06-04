-- Fix slot availability check to properly handle multi-day bookings (monthly/quarterly)
-- by checking if the requested date range overlaps with any existing booking's date range.

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
  -- 1. If incoming booking is a full-day or multi-day type (half_day, full_day, monthly, quarterly),
  --    block if ANY active booking overlaps with the requested date range.
  IF p_slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly') THEN
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
    
    -- Also check temporary reservations for overlaps
    SELECT COUNT(*) INTO conflict_count
    FROM temporary_reservations
    WHERE facility_id = p_facility_id
      AND expires_at > NOW()
      AND session_token != COALESCE(p_exclude_id::text, '')
      AND booking_date <= req_end_date
      AND COALESCE(end_date, booking_date) >= req_start_date;
      
    RETURN conflict_count = 0;
  END IF;

  -- 2. For incoming hourly booking:
  -- First check if any full-day/multi-day booking overlaps with the requested date
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND status NOT IN ('rejected', 'cancelled', 'expired')
    AND slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly')
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND booking_date <= req_end_date
    AND COALESCE(end_date, booking_date) >= req_start_date;

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- Check if any full-day/multi-day temp reservation overlaps
  SELECT COUNT(*) INTO conflict_count
  FROM temporary_reservations
  WHERE facility_id = p_facility_id
    AND expires_at > NOW()
    AND slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly')
    AND booking_date <= req_end_date
    AND COALESCE(end_date, booking_date) >= req_start_date;

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- Then check for hourly time overlaps on the EXACT date 
  -- (since hourly slots don't span multiple days)
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND status NOT IN ('rejected', 'cancelled', 'expired')
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND start_time < p_end_time
    AND end_time > p_start_time;

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- Also check temporary reservations for hourly time overlap
  SELECT COUNT(*) INTO conflict_count
  FROM temporary_reservations
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND expires_at > NOW()
    AND session_token != COALESCE(p_exclude_id::text, '')
    AND start_time < p_end_time
    AND end_time > p_start_time;

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
