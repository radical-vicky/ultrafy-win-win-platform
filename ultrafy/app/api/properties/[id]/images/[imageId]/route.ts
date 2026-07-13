import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; imageId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const image = await prisma.propertyImage.findUnique({
    where: { id: params.imageId },
    include: { property: true },
  });
  if (!image || image.propertyId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = session.userId === image.property.ownerId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await deleteCloudinaryImage(image.publicId);
  } catch (err) {
    // Don't block the DB cleanup on a Cloudinary hiccup — log and continue,
    // otherwise a stale asset can leave the user stuck unable to remove a photo.
    console.error("[images] cloudinary delete failed, removing DB row anyway", err);
  }

  await prisma.propertyImage.delete({ where: { id: image.id } });

  return NextResponse.json({ ok: true });
}
