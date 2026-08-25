import { z } from "zod";

// ---- Step 3: Booking Details Form ----
export const bookingFormSchema = z
  .object({
    customerName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name too long"),
    customerEmail: z
      .string()
      .email("Please enter a valid email address"),
    customerPhone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    isResident: z.boolean(),
    houseNumber: z.string().optional(),
    referenceResident: z.string().optional(),
    eventPurpose: z.string().optional(),
    guestCount: z
      .union([z.number().int().min(1).max(1000), z.nan()])
      .transform((v) => (isNaN(v as number) ? undefined : v))
      .optional(),
    customerGstNumber: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Enter a valid 15-character GSTIN")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => !data.isResident || (data.isResident && !!data.houseNumber?.trim()),
    {
      message: "House/flat number is required for residents",
      path: ["houseNumber"],
    }
  );

export type BookingFormSchema = z.infer<typeof bookingFormSchema>;

// ---- Payment Upload Form ----
export const paymentUploadSchema = z.object({
  paymentProofUrl: z.string().url("Invalid payment proof URL"),
  paymentPublicId: z.string().min(1, "Missing Cloudinary public ID"),
  paymentReference: z
    .string()
    .min(6, "Enter a valid UTR/reference number (min 6 characters)")
    .max(50, "Reference number too long"),
});

export type PaymentUploadSchema = z.infer<typeof paymentUploadSchema>;

// ---- Admin Login Form ----
export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AdminLoginSchema = z.infer<typeof adminLoginSchema>;

// ---- Admin: Reject Booking ----
export const rejectBookingSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a reason (min 10 characters)")
    .max(300, "Reason too long"),
});

export type RejectBookingSchema = z.infer<typeof rejectBookingSchema>;

// ---- Admin: Block Date ----
export const blockDateSchema = z.object({
  facilityId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  reason: z.string().min(3, "Please provide a reason").max(200),
});

export type BlockDateSchema = z.infer<typeof blockDateSchema>;
