import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { notifyOwnerContractReady } from "@/lib/mailer";

const contractSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "SIGNED", "ACTIVE", "EXPIRED", "CANCELLED"]),
  terms: z.string().optional(),
  notes: z.string().optional(),
  documentUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id }, include: { contract: true } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.userId === property.ownerId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ contract: property.contract });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const property = await prisma.property.findUnique({ where: { id: params.id }, include: { owner: true, contract: true } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = contractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status, terms, notes, documentUrl, startDate, endDate } = parsed.data;

  const contract = await prisma.contract.upsert({
    where: { propertyId: property.id },
    create: {
      propertyId: property.id,
      ownerId: property.ownerId,
      status,
      terms: terms || null,
      notes: notes || null,
      documentUrl: documentUrl || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      signedAt: status === "SIGNED" || status === "ACTIVE" ? new Date() : null,
    },
    update: {
      status,
      terms: terms || null,
      notes: notes || null,
      documentUrl: documentUrl || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ...(status === "SIGNED" || status === "ACTIVE" ? { signedAt: new Date() } : {}),
    },
  });

  if (status === "SENT" && property.contract?.status !== "SENT") {
    notifyOwnerContractReady({
      to: property.owner.email,
      propertyTitle: property.title,
      reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${property.id}/contract`,
    }).catch((err) => console.error("[mailer] contract-ready notify failed", err));
  }

  return NextResponse.json({ contract });
}
