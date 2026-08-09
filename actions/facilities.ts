"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import type { Facility, FacilityMedia, FacilityPackage, FacilityWithMedia } from "@/types/database";
import type { ActionResult } from "@/types";
import type { FacilitySchema, FacilityPackageSchema } from "@/lib/validations/facility";

const SOCIETY_ID = process.env.NEXT_PUBLIC_SOCIETY_ID!;

// ---- helpers ----
async function verifyAdmin() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  return user;
}

// ============================================================
// LIST FACILITIES
// ============================================================

export async function getFacilities(includeInactive = false): Promise<Facility[]> {
  const db = createAdminClient();
  let query = db
    .from("facilities")
    .select("*, facility_packages(id, price, type, is_active)")
    .eq("society_id", SOCIETY_ID)
    .order("display_order", { ascending: true });

  if (!includeInactive) {
    query = query.eq("status", "active");
  }

  const { data } = await query;
  return (data ?? []) as Facility[];
}

// ============================================================
// GET SINGLE FACILITY WITH MEDIA & PACKAGES
// ============================================================

export async function getFacilityBySlug(slug: string): Promise<FacilityWithMedia | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("facilities")
    .select("*, facility_media(*), facility_packages(*)")
    .eq("slug", slug)
    .eq("society_id", SOCIETY_ID)
    .single();

  if (!data) return null;
  // Sort in JS — Supabase JS doesn't support ORDER BY inside nested selects
  const result = data as any;
  result.facility_media = (result.facility_media ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
  result.facility_packages = (result.facility_packages ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
  return result as FacilityWithMedia;
}

export async function getFacilityById(id: string): Promise<FacilityWithMedia | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("facilities")
    .select("*, facility_media(*), facility_packages(*)")
    .eq("id", id)
    .single();

  if (!data) return null;
  const result = data as any;
  result.facility_media = (result.facility_media ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
  result.facility_packages = (result.facility_packages ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
  return result as FacilityWithMedia;
}

// ============================================================
// CREATE FACILITY (Admin)
// ============================================================

export async function createFacility(
  values: FacilitySchema
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("facilities")
    .insert({
      society_id: SOCIETY_ID,
      name: values.name,
      slug: values.slug,
      description: values.description ?? null,
      short_description: values.shortDescription ?? null,
      category: values.category,
      rules: values.rules ?? null,
      min_capacity: values.minCapacity ?? 1,
      max_capacity: values.maxCapacity ?? null,
      inventory_count: values.inventoryCount ?? 1,
      status: values.status,
      display_order: values.displayOrder,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A facility with this slug already exists." };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: data! };
}

// ============================================================
// UPDATE FACILITY (Admin)
// ============================================================

export async function updateFacility(
  id: string,
  values: Partial<FacilitySchema> & { thumbnailUrl?: string }
): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("facilities")
    .update({
      name: values.name,
      slug: values.slug,
      description: values.description ?? null,
      short_description: values.shortDescription ?? null,
      category: values.category,
      rules: values.rules ?? null,
      min_capacity: values.minCapacity ?? 1,
      max_capacity: values.maxCapacity ?? null,
      inventory_count: values.inventoryCount ?? 1,
      status: values.status,
      display_order: values.displayOrder,
      thumbnail_url: values.thumbnailUrl ?? undefined,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================
// ADD FACILITY MEDIA (Admin)
// ============================================================

export async function addFacilityMedia(params: {
  facilityId: string;
  url: string;
  publicId: string;
  mediaType: "image" | "video";
  displayOrder?: number;
}): Promise<ActionResult<FacilityMedia>> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("facility_media")
    .insert({
      facility_id: params.facilityId,
      url: params.url,
      public_id: params.publicId,
      media_type: params.mediaType,
      display_order: params.displayOrder ?? 0,
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as FacilityMedia };
}

// ============================================================
// DELETE FACILITY MEDIA (Admin)
// ============================================================

export async function deleteFacilityMedia(mediaId: string): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();

  // Get public_id for Cloudinary cleanup
  const { data: media } = await db
    .from("facility_media")
    .select("public_id")
    .eq("id", mediaId)
    .single();

  if (media?.public_id) {
    await deleteCloudinaryAsset(media.public_id).catch(console.error);
  }

  const { error } = await db.from("facility_media").delete().eq("id", mediaId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================
// MANAGE PACKAGES (Admin)
// ============================================================

export async function createFacilityPackage(
  facilityId: string,
  values: FacilityPackageSchema
): Promise<ActionResult<FacilityPackage>> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("facility_packages")
    .insert({
      facility_id: facilityId,
      name: values.name,
      type: values.type,
      price: values.price,
      resident_price: values.residentPrice ?? null,
      duration_hours: values.durationHours ?? null,
      start_time: values.startTime ?? null,
      end_time: values.endTime ?? null,
      description: values.description ?? null,
      is_active: values.isActive,
      display_order: values.displayOrder,
      gst_percentage: values.gstPercentage,
      is_gst_inclusive: values.isGstInclusive,
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as FacilityPackage };
}

export async function updateFacilityPackage(
  packageId: string,
  values: Partial<FacilityPackageSchema>
): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("facility_packages")
    .update({
      name: values.name,
      type: values.type,
      price: values.price,
      resident_price: values.residentPrice ?? null,
      duration_hours: values.durationHours ?? null,
      start_time: values.startTime ?? null,
      end_time: values.endTime ?? null,
      description: values.description ?? null,
      is_active: values.isActive,
      display_order: values.displayOrder,
      gst_percentage: values.gstPercentage,
      is_gst_inclusive: values.isGstInclusive,
    })
    .eq("id", packageId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteFacilityPackage(packageId: string): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("facility_packages").delete().eq("id", packageId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================
// BLOCKED DATES (Admin)
// ============================================================

export async function getBlockedDates(facilityId?: string) {
  const db = createAdminClient();
  let query = db
    .from("blocked_dates")
    .select("*")
    .eq("society_id", SOCIETY_ID)
    .order("start_date", { ascending: true });

  if (facilityId) {
    query = query.or(`facility_id.eq.${facilityId},facility_id.is.null`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function blockDates(params: {
  facilityId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  adminId: string;
}): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("blocked_dates").insert({
    facility_id: params.facilityId ?? null,
    society_id: SOCIETY_ID,
    start_date: params.startDate,
    end_date: params.endDate,
    reason: params.reason,
    blocked_by: user.id,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeBlockedDate(id: string): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("blocked_dates").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
