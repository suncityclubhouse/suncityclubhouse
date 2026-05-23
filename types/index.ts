// App-level types for forms, UI state, and action payloads
// These are distinct from raw DB row types in types/database.ts

import type { SlotType, BookingStatus } from "./database";

// ---- Booking Wizard State ----
export interface BookingWizardState {
  facilityId: string;
  facilitySlug: string;
  selectedDate: Date | null;
  selectedPackageId: string | null;
  slotType: SlotType | null;
  startTime: string | null;
  endTime: string | null;
  totalAmount: number;
  sessionToken: string | null;    // from temporary reservation
  reservationExpiresAt: string | null;
}

// ---- Booking Form (Step 3) ----
export interface BookingFormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isResident: boolean;
  houseNumber?: string;
  referenceResident?: string;
  eventPurpose: string;
  guestCount?: number;
}

// ---- Payment Upload (Step 4) ----
export interface PaymentUploadValues {
  paymentProofUrl: string;
  paymentPublicId: string;
  paymentReference: string;
}

// ---- Admin Booking Filters ----
export interface BookingFilters {
  status?: BookingStatus | "all";
  facilityId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---- Dashboard KPIs ----
export interface DashboardKPIs {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  pendingApprovals: number;
  upcomingBookings: number;
  occupancyRate: number;
  mostBookedFacility: string | null;
}

// ---- Revenue Chart Data ----
export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

// ---- Facility Usage (Pie Chart) ----
export interface FacilityUsageData {
  name: string;
  value: number;
  color: string;
}

// ---- Booking Status Distribution ----
export interface BookingStatusData {
  status: BookingStatus;
  count: number;
}

// ---- Availability Slot ----
export interface TimeSlot {
  startTime: string;     // "HH:MM"
  endTime: string;       // "HH:MM"
  isAvailable: boolean;
  isReserved: boolean;   // temporary hold
}

// ---- Server Action Response ----
export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}
