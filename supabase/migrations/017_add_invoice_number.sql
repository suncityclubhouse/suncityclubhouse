-- Migration 017: Add invoice_number + customer_gst_number to bookings
-- =============================================================================
--
-- invoice_number: A sequential integer assigned at the moment a booking is
--   confirmed or completed. It is IMMUTABLE — once assigned it never changes,
--   even if the booking is later cancelled. Gaps in the sequence are permitted
--   (standard accounting practice: deleted/voided invoices leave gaps).
--
-- customer_gst_number: Optional GST registration number provided by the
--   customer at booking time for B2B invoicing.
--
-- The auto-assignment trigger fires BEFORE INSERT / BEFORE UPDATE so that the
-- number is set atomically inside the same transaction that changes the status.
-- =============================================================================

-- 1. Add columns ---------------------------------------------------------------

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS invoice_number    integer        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS customer_gst_number varchar(20)  DEFAULT NULL;

COMMENT ON COLUMN bookings.invoice_number IS
  'Sequential invoice number assigned when a booking is first confirmed/completed. Immutable once set.';

COMMENT ON COLUMN bookings.customer_gst_number IS
  'Optional GST number provided by the customer for B2B tax invoices.';

-- 2. Unique constraint (within society) ----------------------------------------
--   Prevents two bookings in the same society from sharing an invoice number.
--   NULL values are excluded from uniqueness checks automatically in Postgres.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_invoice_number_society
  ON bookings (society_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

-- 3. Helper function: next invoice number for a society -----------------------
--   Returns MAX(invoice_number) + 1, or 1 if no invoices exist yet.
--   Uses advisory lock to prevent race conditions when two bookings are
--   confirmed simultaneously.

CREATE OR REPLACE FUNCTION next_invoice_number(p_society_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_next integer;
BEGIN
  SELECT COALESCE(MAX(invoice_number), 0) + 1
    INTO v_next
    FROM bookings
   WHERE society_id = p_society_id
     AND invoice_number IS NOT NULL;

  RETURN v_next;
END;
$$;

-- 4. Trigger function: auto-assign invoice_number on confirmation --------------

CREATE OR REPLACE FUNCTION assign_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only assign when transitioning INTO confirmed or completed AND not already set
  IF NEW.invoice_number IS NULL
     AND NEW.status IN ('confirmed', 'completed')
     AND (OLD IS NULL OR OLD.status NOT IN ('confirmed', 'completed'))
  THEN
    -- Use pg_advisory_xact_lock keyed on the society_id hash to serialise
    -- concurrent confirmations within the same society
    PERFORM pg_advisory_xact_lock(hashtext(NEW.society_id::text));
    NEW.invoice_number := next_invoice_number(NEW.society_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old trigger first (idempotent)
DROP TRIGGER IF EXISTS trg_assign_invoice_number ON bookings;

CREATE TRIGGER trg_assign_invoice_number
  BEFORE INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION assign_invoice_number();

-- 5. Backfill existing confirmed/completed bookings ----------------------------
--   Assign sequential numbers ordered by created_at so the oldest booking
--   gets invoice #1. We use a window function inside a CTE for atomicity.

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY society_id
           ORDER BY created_at ASC
         ) AS rn
    FROM bookings
   WHERE status IN ('confirmed', 'completed')
     AND invoice_number IS NULL
)
UPDATE bookings b
   SET invoice_number = r.rn
  FROM ranked r
 WHERE b.id = r.id;
