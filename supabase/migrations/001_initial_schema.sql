-- ============================================================
-- CLUBHOUSE BOOKING PLATFORM — INITIAL SCHEMA
-- ============================================================
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SOCIETIES (multi-tenant ready, single society in v1)
-- ============================================================
CREATE TABLE societies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  logo_url        TEXT,
  address         TEXT,
  upi_id          TEXT,
  upi_qr_url      TEXT,
  whatsapp_number TEXT,
  contact_email   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMINS (linked to Supabase auth.users)
-- ============================================================
CREATE TABLE admins (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  society_id  UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE facilities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id        UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  description       TEXT,
  short_description TEXT,
  category          TEXT NOT NULL DEFAULT 'general',
  rules             TEXT,
  thumbnail_url     TEXT,
  min_capacity      INTEGER DEFAULT 1,
  max_capacity      INTEGER,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  display_order     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (society_id, slug)
);

-- ============================================================
-- FACILITY MEDIA (images + videos)
-- ============================================================
CREATE TABLE facility_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id   UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  public_id     TEXT,                    -- Cloudinary public_id for deletion
  media_type    TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FACILITY PACKAGES / PRICING
-- ============================================================
CREATE TABLE facility_packages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id     UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('hourly', 'half_day', 'full_day', 'monthly', 'quarterly')),
  price           NUMERIC(10,2) NOT NULL,
  duration_hours  INTEGER,               -- For hourly: how many hours is 1 unit; null for packages
  start_time      TIME,                  -- For half_day/full_day fixed packages
  end_time        TIME,                  -- For half_day/full_day fixed packages
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BLOCKED DATES (maintenance, closures, special events)
-- ============================================================
CREATE TABLE blocked_dates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,  -- NULL = all facilities
  society_id  UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  blocked_by  UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- ============================================================
-- BOOKINGS (core table)
-- ============================================================
CREATE TABLE bookings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref          TEXT NOT NULL UNIQUE,           -- e.g. CB-20240523-A1B2
  facility_id          UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  society_id           UUID NOT NULL REFERENCES societies(id) ON DELETE RESTRICT,
  package_id           UUID REFERENCES facility_packages(id) ON DELETE SET NULL,

  -- Customer details
  customer_name        TEXT NOT NULL,
  customer_email       TEXT NOT NULL,
  customer_phone       TEXT NOT NULL,
  is_resident          BOOLEAN NOT NULL DEFAULT FALSE,
  house_number         TEXT,
  reference_resident   TEXT,
  event_purpose        TEXT NOT NULL,
  guest_count          INTEGER,

  -- Slot details
  booking_date         DATE NOT NULL,
  start_time           TIME,                            -- NULL for monthly/quarterly packages
  end_time             TIME,                            -- NULL for monthly/quarterly packages
  end_date             DATE,                            -- For multi-day packages
  slot_type            TEXT NOT NULL CHECK (slot_type IN ('hourly', 'half_day', 'full_day', 'monthly', 'quarterly')),

  -- Pricing
  base_amount          NUMERIC(10,2) NOT NULL,
  discount_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount         NUMERIC(10,2) NOT NULL,

  -- Booking status
  status               TEXT NOT NULL DEFAULT 'awaiting_payment'
                        CHECK (status IN (
                          'awaiting_payment', 'pending_approval', 'confirmed',
                          'rejected', 'cancelled', 'completed', 'expired'
                        )),

  -- Payment
  payment_proof_url    TEXT,
  payment_public_id    TEXT,                            -- Cloudinary public_id
  payment_reference    TEXT,                            -- UTR/transaction ID
  payment_uploaded_at  TIMESTAMPTZ,
  payment_verified_at  TIMESTAMPTZ,
  payment_verified_by  UUID REFERENCES admins(id) ON DELETE SET NULL,

  -- Admin actions
  admin_notes          TEXT,
  rejection_reason     TEXT,
  approved_by          UUID REFERENCES admins(id) ON DELETE SET NULL,
  approved_at          TIMESTAMPTZ,
  cancelled_by         UUID REFERENCES admins(id) ON DELETE SET NULL,
  cancelled_at         TIMESTAMPTZ,

  -- Timestamps
  expires_at           TIMESTAMPTZ,                     -- 15-min hold expiry
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEMPORARY RESERVATIONS (15-min slot hold during booking)
-- ============================================================
CREATE TABLE temporary_reservations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id   UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  booking_date  DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  end_date      DATE,
  slot_type     TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS LOG
-- ============================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE,
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('user', 'admin')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_facilities_society_id       ON facilities(society_id);
CREATE INDEX idx_facilities_slug             ON facilities(slug);
CREATE INDEX idx_facilities_status          ON facilities(status);
CREATE INDEX idx_facility_media_facility_id  ON facility_media(facility_id);
CREATE INDEX idx_facility_packages_facility  ON facility_packages(facility_id);
CREATE INDEX idx_bookings_facility_date      ON bookings(facility_id, booking_date);
CREATE INDEX idx_bookings_status             ON bookings(status);
CREATE INDEX idx_bookings_customer_email     ON bookings(customer_email);
CREATE INDEX idx_bookings_booking_ref        ON bookings(booking_ref);
CREATE INDEX idx_bookings_created_at         ON bookings(created_at DESC);
CREATE INDEX idx_blocked_dates_facility      ON blocked_dates(facility_id, start_date, end_date);
CREATE INDEX idx_temp_reservations_facility  ON temporary_reservations(facility_id, booking_date);
CREATE INDEX idx_temp_reservations_expires   ON temporary_reservations(expires_at);
CREATE INDEX idx_temp_reservations_token     ON temporary_reservations(session_token);
CREATE INDEX idx_notifications_booking       ON notifications(booking_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_societies
  BEFORE UPDATE ON societies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_facilities
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_facility_packages
  BEFORE UPDATE ON facility_packages
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- BOOKING REF GENERATOR FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  rand_part TEXT;
  ref       TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  rand_part := UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 4));
  ref := 'CB-' || date_part || '-' || rand_part;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CONFLICT-SAFE BOOKING CHECK FUNCTION
-- Prevents double bookings and overlapping slots
-- ============================================================
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_facility_id  UUID,
  p_booking_date DATE,
  p_start_time   TIME,
  p_end_time     TIME,
  p_slot_type    TEXT,
  p_exclude_id   UUID DEFAULT NULL  -- exclude current booking when editing
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- For package types (half_day, full_day), check entire date
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

  -- For hourly slots, check time overlap
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE facility_id = p_facility_id
    AND booking_date = p_booking_date
    AND status NOT IN ('rejected', 'cancelled', 'expired')
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND start_time < p_end_time
    AND end_time > p_start_time;

  -- Also check temporary reservations
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

-- ============================================================
-- SEED DATA — Single Society (v1)
-- ============================================================
-- INSERT INTO societies (name, slug, upi_id, whatsapp_number)
-- VALUES ('Suncity Clubhouse', 'suncity', 'suncity@upi', '919876543210');
-- After insert, copy the ID and set it as NEXT_PUBLIC_SOCIETY_ID in .env.local

-- ============================================================
-- SEED DATA — Default Facilities (examples)
-- ============================================================
-- Run after inserting the society and getting its ID:
/*
INSERT INTO facilities (society_id, name, slug, short_description, category, display_order) VALUES
  ('YOUR-SOCIETY-UUID', 'Banquet Hall',    'banquet-hall',    'Premium venue for weddings and celebrations', 'event',   1),
  ('YOUR-SOCIETY-UUID', 'Badminton Court', 'badminton-court', 'Professional indoor badminton courts',         'sports',  2),
  ('YOUR-SOCIETY-UUID', 'Squash Court',    'squash-court',    'Full-size squash courts with proper flooring', 'sports',  3),
  ('YOUR-SOCIETY-UUID', 'Guest Rooms',     'guest-rooms',     'Comfortable rooms for visiting guests',        'accommodation', 4),
  ('YOUR-SOCIETY-UUID', 'Swimming Pool',   'swimming-pool',   'Olympic-size pool with safety equipment',      'recreation', 5),
  ('YOUR-SOCIETY-UUID', 'Lawn Area',       'lawn-area',       'Open lawn for outdoor events and gatherings',  'outdoor', 6);
*/
