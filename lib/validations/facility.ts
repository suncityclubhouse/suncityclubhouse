import { z } from "zod";

export const facilitySchema = z.object({
  name: z.string().min(2, "Name required").max(100),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(200).optional(),
  category: z.string().min(1, "Category required"),
  rules: z.string().max(5000).optional(),
  minCapacity: z.number().int().min(1).optional(),
  maxCapacity: z.number().int().min(1).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
  displayOrder: z.number().int().min(0).default(0),
});

export type FacilitySchema = z.infer<typeof facilitySchema>;

export const facilityPackageSchema = z.object({
  name: z.string().min(1, "Package name required").max(100),
  type: z.enum(["hourly", "half_day", "full_day", "monthly", "quarterly"]),
  price: z.number().min(0, "Price must be at least 0"),
  durationHours: z.number().int().min(1).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export type FacilityPackageSchema = z.infer<typeof facilityPackageSchema>;
