-- ============================================================
-- MIGRATION 009: Facility Inventory & Booking Quantity
-- ============================================================
-- Adds inventory_count to facilities (for accommodation rooms)
-- and quantity to bookings + temporary_reservations.
-- Updates check_slot_availability to be inventory-aware.
-- ============================================================

-- 1. Add inventory_count to facilities
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS inventory_count INTEGER NOT NULL DEFAULT 1;

-- 2. Add quantity to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- 3. Add quantity to temporary_reservations
ALTER TABLE temporary_reservations
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- ============================================================
-- 4. Rewrite check_slot_availability to be inventory-aware
-- For accommodation: sums quantity of overlapping bookings.
-- For all others: keeps existing single-booking logic.
-- ============================================================
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_facility_id  UUID,
  p_booking_date DATE,
  p_start_time   TIME,
  p_end_time     TIME,
  p_slot_type    TEXT,
  p_exclude_id   UUID DEFAULT NULL,
  p_end_date     DATE DEFAULT NULL,
  p_quantity     INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count    INTEGER;
  booked_quantity   INTEGER;
  fac_inventory     INTEGER;
  fac_category      TEXT;
  effective_end     DATE;
BEGIN
  effective_end := COALESCE(p_end_date, p_booking_date);

  -- Get facility category and inventory
  SELECT category, inventory_count
    INTO fac_category, fac_inventory
    FROM facilities
   WHERE id = p_facility_id;

  -- ── ACCOMMODATION: inventory-aware check ─────────────────────
  IF fac_category = 'accommodation' THEN
    -- Sum booked quantity from confirmed bookings in overlapping date range
    SELECT COALESCE(SUM(b.quantity), 0)
      INTO booked_quantity
      FROM bookings b
     WHERE b.facility_id = p_facility_id
       AND b.status NOT IN ('rejected', 'cancelled', 'expired')
       AND (p_exclude_id IS NULL OR b.id != p_exclude_id)
       AND b.booking_date <= effective_end
       AND COALESCE(b.end_date, b.booking_date) >= p_booking_date;

    -- Sum quantity from active temporary reservations in same range
    SELECT booked_quantity + COALESCE(SUM(tr.quantity), 0)
      INTO booked_quantity
      FROM temporary_reservations tr
     WHERE tr.facility_id = p_facility_id
       AND tr.expires_at > NOW()
       AND tr.booking_date <= effective_end
       AND COALESCE(tr.end_date, tr.booking_date) >= p_booking_date;

    RETURN (booked_quantity + p_quantity) <= fac_inventory;
  END IF;

  -- ── ALL OTHER FACILITIES: original single-booking logic ──────
  IF p_slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly') THEN
    SELECT COUNT(*) INTO conflict_count
      FROM bookings
     WHERE facility_id = p_facility_id
       AND booking_date = p_booking_date
       AND status NOT IN ('rejected', 'cancelled', 'expired')
       AND (p_exclude_id IS NULL OR id != p_exclude_id)
       AND slot_type IN ('half_day', 'full_day', 'monthly', 'quarterly');

    RETURN conflict_count = 0;
  END IF;

  -- Hourly: check time overlap
  SELECT COUNT(*) INTO conflict_count
    FROM bookings
   WHERE facility_id = p_facility_id
     AND booking_date = p_booking_date
     AND status NOT IN ('rejected', 'cancelled', 'expired')
     AND (p_exclude_id IS NULL OR id != p_exclude_id)
     AND start_time < p_end_time
     AND end_time > p_start_time;

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
