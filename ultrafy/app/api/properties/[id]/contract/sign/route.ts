import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getClientIp } from "@/lib/rate-limit";

const schema = z.object({ typedName: z.string().min(2, "Type your full legal name to sign") });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id: params.id }, include: { contract: true } });
  if (!property || !property.contract) return NextResponse.json({ error: "No contract found for this property." }, { status: 404 });
  if (property.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (property.contract.status !== "SENT") {
    return NextResponse.json(
      { error: "This contract isn't ready to sign yet. It must be sent for review first." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contract = await prisma.contract.update({
    where: { id: property.contract.id },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      ownerSignedName: parsed.data.typedName,
      ownerSignedIp: getClientIp(req),
    },
  });

  return NextResponse.json({ contract });
}
