import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyUserRejected } from "@/lib/mailer";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason: string | undefined = body?.reason;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { approvalStatus: "REJECTED", rejectedReason: reason ?? null },
  });

  notifyUserRejected({ to: user.email, name: user.name, reason }).catch((err) =>
    console.error("[mailer] user-rejected notify failed", err)
  );

  return NextResponse.json({ user: { id: user.id, approvalStatus: user.approvalStatus } });
}
