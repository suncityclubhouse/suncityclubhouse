// Database row types — mirrors Supabase schema exactly
// Keep in sync with supabase/migrations/001_initial_schema.sql

export type BookingStatus =
  | "awaiting_payment"
  | "pending_approval"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "expired";

export type SlotType =
  | "hourly"
  | "half_day"
  | "full_day"
  | "monthly"
  | "quarterly";

export type PackageType = SlotType;

export type MediaType = "image" | "video";

export type AdminRole = "admin" | "super_admin";

export type NotificationStatus = "pending" | "sent" | "failed";

export type NotificationRecipientType = "user" | "admin";

export type FacilityStatus = "active" | "inactive" | "maintenance";

// ---- Row types ----

export interface Society {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  upi_id: string | null;
  upi_qr_url: string | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  society_id: string;
  name: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface Facility {
  id: string;
  society_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string;
  rules: string | null;
  thumbnail_url: string | null;
  min_capacity: number;
  max_capacity: number | null;
  inventory_count: number;          // for accommodation: total rooms available
  status: FacilityStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FacilityMedia {
  id: string;
  facility_id: string;
  url: string;
  public_id: string | null;
  media_type: MediaType;
  display_order: number;
  created_at: string;
}

export interface FacilityPackage {
  id: string;
  facility_id: string;
  name: string;
  type: PackageType;
  price: number;
  resident_price: number | null;
  duration_hours: number | null;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  facility_id: string | null;
  society_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_ref: string;
  facility_id: string;
  society_id: string;
  package_id: string | null;
  // Customer
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  is_resident: boolean;
  house_number: string | null;
  reference_resident: string | null;
  event_purpose: string;
  guest_count: number | null;
  // Slot
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  end_date: string | null;
  slot_type: SlotType;
  quantity: number;                 // rooms/units booked (accommodation)
  // Pricing
  base_amount: number;
  discount_amount: number;
  total_amount: number;
  // Status
  status: BookingStatus;
  // Payment
  payment_proof_url: string | null;
  payment_public_id: string | null;
  payment_reference: string | null;
  payment_uploaded_at: string | null;
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  resident_verification_token: string | null;
  // Admin
  admin_notes: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  // Timestamps
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemporaryReservation {
  id: string;
  facility_id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  end_date: string | null;
  slot_type: SlotType;
  quantity: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  booking_id: string | null;
  society_id: string;
  type: string;
  recipient_email: string;
  recipient_type: NotificationRecipientType;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  society_id: string;
  facility_id: string | null;
  expense_category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Joined/enriched types used in UI ----

export interface FacilityWithMedia extends Facility {
  facility_media: FacilityMedia[];
  facility_packages: FacilityPackage[];
}

export interface BookingWithFacility extends Booking {
  facility: Pick<Facility, "id" | "name" | "slug" | "thumbnail_url">;
  package: Pick<FacilityPackage, "id" | "name" | "type"> | null;
}
