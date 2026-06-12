-- Migration: Add resident pricing

-- 1. Add resident_price to facility_packages
ALTER TABLE facility_packages ADD COLUMN resident_price NUMERIC(10, 2) DEFAULT NULL;

-- 2. Add verification token to bookings to prevent tampering
ALTER TABLE bookings ADD COLUMN resident_verification_token TEXT DEFAULT NULL;
