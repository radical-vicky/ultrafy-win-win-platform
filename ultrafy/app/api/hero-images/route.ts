import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const images = await prisma.heroImage.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    take: 8,
  });
  return NextResponse.json({ images });
}

const schema = z.object({ url: z.string().url(), publicId: z.string().min(1), caption: z.string().optional() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A valid image url and publicId are required." }, { status: 400 });

  const count = await prisma.heroImage.count();
  const image = await prisma.heroImage.create({
    data: { url: parsed.data.url, publicId: parsed.data.publicId, caption: parsed.data.caption, order: count },
  });

  return NextResponse.json({ image }, { status: 201 });
}
