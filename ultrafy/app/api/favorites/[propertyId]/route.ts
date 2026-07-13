import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: { propertyId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await prisma.favorite.deleteMany({
    where: { userId: session.userId, propertyId: params.propertyId },
  });

  return NextResponse.json({ ok: true });
}
