import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]).optional().default("IMAGE"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.userId === property.ownerId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A valid image url and publicId are required." }, { status: 400 });

  const existingCount = await prisma.propertyImage.count({ where: { propertyId: property.id } });

  const image = await prisma.propertyImage.create({
    data: {
      propertyId: property.id,
      url: parsed.data.url,
      publicId: parsed.data.publicId,
      type: parsed.data.type,
      order: existingCount,
      isPrimary: existingCount === 0,
    },
  });

  return NextResponse.json({ image }, { status: 201 });
}
