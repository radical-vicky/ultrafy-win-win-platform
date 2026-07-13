import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyOwnerRejected } from "@/lib/mailer";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = body?.reason;

  const property = await prisma.property.update({
    where: { id: params.id },
    data: { status: "REJECTED", rejectedReason: reason ?? null },
    include: { owner: true },
  });

  notifyOwnerRejected({ to: property.owner.email, propertyTitle: property.title, reason }).catch((err) =>
    console.error("[mailer] owner reject notify failed", err)
  );

  return NextResponse.json({ property });
}
