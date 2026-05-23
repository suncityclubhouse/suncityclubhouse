import { cloudinary } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/upload
 * Accepts a multipart FormData with a `file` field.
 * Uploads directly to Cloudinary server-side and returns { url, publicId }.
 * Requires admin authentication.
 */
export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "clubhouse/facilities";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File → Buffer for Cloudinary upload stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary via upload_stream wrapped in a Promise
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
            overwrite: true,
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("Upload failed"));
            resolve(result as { secure_url: string; public_id: string });
          }
        );
        stream.end(buffer);
      }
    );

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err: any) {
    console.error("[/api/upload] Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
