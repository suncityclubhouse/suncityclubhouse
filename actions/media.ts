"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

async function verifyAdmin() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  return user;
}

export async function deleteMediaItem(mediaId: string): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("facility_media").delete().eq("id", mediaId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function reorderMediaItems(
  items: { id: string; display_order: number }[]
): Promise<ActionResult> {
  const user = await verifyAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  const db = createAdminClient();
  await Promise.all(
    items.map(({ id, display_order }) =>
      db.from("facility_media").update({ display_order }).eq("id", id)
    )
  );
  return { success: true };
}

export async function addMediaItem(params: {
  facilityId: string;
  url: string;
  publicId: string;
  mediaType: "image" | "video";
  displayOrder: number;
}): Promise<ActionResult<{ id: string }>> {
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
      display_order: params.displayOrder,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };
  return { success: true, data: { id: data.id } };
}
