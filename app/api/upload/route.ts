import { cloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

/**
 * POST /api/upload
 * Accepts a multipart FormData with a `file` field.
 * Uploads directly to Cloudinary server-side and returns { url, publicId }.
 * Public endpoint — used by customers uploading payment proof screenshots.
 */
export async function POST(request: Request) {

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "clubhouse/facilities";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size limits: 50MB for video, 10MB for image
    const isVideo = file.type.startsWith("video");
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      const label = isVideo ? "50 MB" : "10 MB";
      return NextResponse.json(
        { error: `File too large. Maximum size is ${label}.` },
        { status: 413 }
      );
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
