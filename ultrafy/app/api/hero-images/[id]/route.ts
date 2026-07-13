import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const image = await prisma.heroImage.findUnique({ where: { id: params.id } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteCloudinaryImage(image.publicId);
  } catch (err) {
    console.error("[hero-images] cloudinary delete failed, removing DB row anyway", err);
  }
  await prisma.heroImage.delete({ where: { id: image.id } });

  return NextResponse.json({ ok: true });
}
