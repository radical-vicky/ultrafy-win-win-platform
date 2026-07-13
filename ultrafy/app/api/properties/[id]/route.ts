import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { propertySchema } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { order: "asc" } },
      owner: { select: { name: true, email: true, phone: true } },
      contract: true,
    },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (property.status !== "APPROVED") {
    const session = await getSession();
    const isOwner = session?.userId === property.ownerId;
    const isAdmin = session?.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else {
    // fire-and-forget view counter for public listings
    prisma.property.update({ where: { id: property.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  return NextResponse.json({ property });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.userId === existing.ownerId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = propertySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { images, ...data } = parsed.data;

  const property = await prisma.property.update({
    where: { id: params.id },
    data: {
      ...data,
      // an owner edit on a previously-rejected listing sends it back for review
      ...(isOwner && !isAdmin && existing.status === "REJECTED" ? { status: "PENDING", rejectedReason: null } : {}),
    },
    include: { images: true },
  });

  return NextResponse.json({ property });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.userId === existing.ownerId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.property.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
