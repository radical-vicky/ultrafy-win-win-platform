import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyOwnerApproved } from "@/lib/mailer";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const property = await prisma.property.update({
    where: { id: params.id },
    data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.userId, rejectedReason: null },
    include: { owner: true },
  });

  notifyOwnerApproved({ to: property.owner.email, propertyTitle: property.title }).catch((err) =>
    console.error("[mailer] owner approve notify failed", err)
  );

  return NextResponse.json({ property });
}
