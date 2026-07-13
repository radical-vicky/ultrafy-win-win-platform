import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({ orderedIds: z.array(z.string().min(1)).min(1) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.userId === property.ownerId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "orderedIds must be a non-empty array." }, { status: 400 });

  // Make sure every id actually belongs to this property before touching anything.
  const owned = await prisma.propertyImage.findMany({ where: { propertyId: property.id } });
  const ownedIds = new Set(owned.map((i) => i.id));
  if (!parsed.data.orderedIds.every((id) => ownedIds.has(id))) {
    return NextResponse.json({ error: "One or more images don't belong to this property." }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.propertyImage.update({ where: { id }, data: { order: index, isPrimary: index === 0 } })
    )
  );

  return NextResponse.json({ ok: true });
}
