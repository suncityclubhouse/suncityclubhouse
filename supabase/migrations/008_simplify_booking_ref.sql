-- ============================================================
-- MIGRATION 008: Simplify Booking Reference Format
-- ============================================================
-- Changes booking ref from "CB-20240523-A1B2" to a clean
-- 6-character uppercase alphanumeric code (e.g. "X9K2P4")
-- which is much easier for users to remember and type.
-- ============================================================

CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no I,O,0,1 to avoid confusion
  ref   TEXT := '';
  i     INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    ref := ref || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
  END LOOP;

  -- Ensure uniqueness — retry if collision (extremely rare with 26^6 combinations)
  IF EXISTS (SELECT 1 FROM bookings WHERE booking_ref = ref) THEN
    RETURN generate_booking_ref();
  END IF;

  RETURN ref;
END;
$$ LANGUAGE plpgsql;
