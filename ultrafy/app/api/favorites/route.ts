import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    include: {
      property: {
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites });
}

const schema = z.object({ propertyId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "propertyId is required." }, { status: 400 });

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.status !== "APPROVED") {
    return NextResponse.json({ error: "This property isn't available to save." }, { status: 404 });
  }

  const favorite = await prisma.favorite.upsert({
    where: { userId_propertyId: { userId: session.userId, propertyId: parsed.data.propertyId } },
    create: { userId: session.userId, propertyId: parsed.data.propertyId },
    update: {},
  });

  return NextResponse.json({ favorite }, { status: 201 });
}
