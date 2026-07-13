import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import AdminHeroManager from "@/components/AdminHeroManager";

export default async function AdminHeroPage() {
  await requireAdmin();
  const images = await prisma.heroImage.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/admin" className="text-sm text-brand-600 hover:underline">← Back to review queue</Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Homepage hero images</h1>
      <div className="mt-6">
        <AdminHeroManager initialImages={images} />
      </div>
    </div>
  );
}
