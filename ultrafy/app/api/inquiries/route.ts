import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyOwnerNewInquiry } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";

const authenticatedInquirySchema = z.object({
  propertyId: z.string().min(1),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");

  const inquiries = await prisma.inquiry.findMany({
    where: {
      ...(propertyId ? { propertyId } : {}),
      ...(session.role === "ADMIN" ? {} : { property: { ownerId: session.userId } }),
    },
    include: { property: { select: { title: true, id: true, ownerId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inquiries });
}

export async function POST(req: NextRequest) {
  // Like Kilimall/most marketplaces: anyone can browse and read listings,
  // but reaching out to the owner requires an account — same principle as
  // "log in to place an order."
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in or create a free account to contact this owner." }, { status: 401 });
  }

  const limited = await rateLimit(`inquiry:${session.userId}`, 8, 10 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many inquiries sent. Please try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = authenticatedInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    include: { owner: true },
  });
  if (!property || property.status !== "APPROVED") {
    return NextResponse.json({ error: "This property is not available for inquiries." }, { status: 404 });
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      propertyId: property.id,
      name: session.name,
      email: session.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
    },
  });

  notifyOwnerNewInquiry({
    to: property.owner.email,
    propertyTitle: property.title,
    inquirerName: session.name,
    inquirerEmail: session.email,
    message: parsed.data.message,
  }).catch((err) => console.error("[mailer] inquiry notify failed", err));

  return NextResponse.json({ inquiry }, { status: 201 });
}
