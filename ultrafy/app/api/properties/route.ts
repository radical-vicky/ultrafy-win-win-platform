import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { propertySchema } from "@/types";
import { notifyAdminNewListing } from "@/lib/mailer";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");
  const status = searchParams.get("status");
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minBedrooms = searchParams.get("minBedrooms");
  const minBathrooms = searchParams.get("minBathrooms");
  const roomTypes = searchParams.getAll("roomTypes"); // supports ?roomTypes=BEDROOM&roomTypes=PARKING

  const session = await getSession();

  const where: Prisma.PropertyWhereInput = {};

  if (mine === "1") {
    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    where.ownerId = session.userId;
    if (status) where.status = status as Prisma.PropertyWhereInput["status"];
  } else if (session?.role === "ADMIN") {
    if (status) where.status = status as Prisma.PropertyWhereInput["status"];
    // admins with no status filter see everything
  } else {
    // public: only approved listings, ever
    where.status = "APPROVED";
  }

  if (city) where.city = { equals: city, mode: "insensitive" };
  if (type) where.type = type as Prisma.PropertyWhereInput["type"];

  const properties = await prisma.property.findMany({
    where,
    include: {
      images: { orderBy: { order: "asc" } },
      owner: { select: { name: true, email: true, phone: true } },
      _count: { select: { inquiries: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const account = await prisma.user.findUnique({ where: { id: session.userId }, select: { approvalStatus: true } });
  if (account?.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      {
        error:
          account?.approvalStatus === "REJECTED"
            ? "Your account wasn't approved for listing properties. Contact support if you think this is a mistake."
            : "Your account is still pending admin approval. You'll be able to list properties once it's approved.",
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { images, ...data } = parsed.data;

  const property = await prisma.property.create({
    data: {
      ...data,
      ownerId: session.userId,
      status: "PENDING",
      images: images?.length
        ? { create: images.map((img, i) => ({ url: img.url, publicId: img.publicId, type: img.type, order: i, isPrimary: i === 0 })) }
        : undefined,
    },
    include: { images: true },
  });

  notifyAdminNewListing({
    propertyTitle: property.title,
    ownerName: session.name,
    ownerEmail: session.email,
    propertyId: property.id,
  }).catch((err) => console.error("[mailer] admin notify failed", err));

  return NextResponse.json({ property }, { status: 201 });
}
