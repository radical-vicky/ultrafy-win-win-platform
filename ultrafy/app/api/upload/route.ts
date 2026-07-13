import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadPropertyImage, uploadImage } from "@/lib/cloudinary";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // ~8MB per photo
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // ~60MB per video

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const dataUri: string | undefined = body?.dataUri;
  const propertyId: string = body?.propertyId || "new";
  const scope: string | undefined = body?.scope;

  const isImage = dataUri?.startsWith("data:image/");
  const isVideo = dataUri?.startsWith("data:video/");
  if (!dataUri || (!isImage && !isVideo)) {
    return NextResponse.json({ error: "A valid image or video file is required." }, { status: 400 });
  }
  if (scope === "hero" && !isImage) {
    return NextResponse.json({ error: "Hero images must be photos." }, { status: 400 });
  }
  const approxBytes = (dataUri.length * 3) / 4;
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (approxBytes > limit) {
    return NextResponse.json({ error: `File too large (max ${isVideo ? "60MB for video" : "8MB for photos"}).` }, { status: 400 });
  }

  if (scope === "hero" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = scope === "hero" ? await uploadImage(dataUri, "ultrafy/hero") : await uploadPropertyImage(dataUri, propertyId);
    return NextResponse.json({ ...result, type: isVideo ? "VIDEO" : "IMAGE" }, { status: 201 });
  } catch (err) {
    console.error("[upload] cloudinary error", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
