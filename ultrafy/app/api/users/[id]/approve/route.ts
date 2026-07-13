import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyUserApproved } from "@/lib/mailer";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { approvalStatus: "APPROVED", approvedAt: new Date(), approvedBy: session.userId, rejectedReason: null },
  });

  notifyUserApproved({ to: user.email, name: user.name }).catch((err) =>
    console.error("[mailer] user-approved notify failed", err)
  );

  return NextResponse.json({ user: { id: user.id, approvalStatus: user.approvalStatus } });
}
