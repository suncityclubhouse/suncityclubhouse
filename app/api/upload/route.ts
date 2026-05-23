import { generateUploadSignature } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/upload
 * Returns a signed Cloudinary upload signature for admin facility media uploads.
 * Requires admin authentication.
 *
 * Body: { folder: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const folder = body.folder ?? "clubhouse/facilities";

  const signatureData = generateUploadSignature(folder);

  return NextResponse.json(signatureData);
}
