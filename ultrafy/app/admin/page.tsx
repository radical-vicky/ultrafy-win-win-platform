import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import AdminPropertyActions from "@/components/AdminPropertyActions";

const TABS = ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;

export default async function AdminPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const status = (searchParams.status && TABS.includes(searchParams.status as any) ? searchParams.status : "PENDING") as (typeof TABS)[number];

  const [properties, counts] = await Promise.all([
    prisma.property.findMany({
      where: { status },
      include: { images: { take: 1, orderBy: { order: "asc" } }, owner: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Listing review</h1>
          <p className="text-sm text-gray-600">Approve new submissions to publish them on the public listings page.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users" className="btn-secondary">Account approvals →</Link>
          <Link href="/admin/hero" className="btn-secondary">Manage homepage hero →</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin?status=${t}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              status === t ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 text-gray-600 hover:bg-brand-50"
            }`}
          >
            {t} ({countFor(t)})
          </Link>
        ))}
      </div>

      {properties.length === 0 ? (
        <div className="glass-card mt-8 p-10 text-center text-gray-500">No {status.toLowerCase()} listings.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {properties.map((p) => (
            <div key={p.id} className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                {p.images[0] ? (
                  <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-brand-300">No photo</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/${p.id}`} className="font-semibold text-gray-900 hover:text-brand-700 hover:underline">{p.title}</Link>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-gray-500">{p.city}, {p.state} · {p.type}</p>
                <p className="text-xs text-gray-400">
                  Owner: {p.owner.name} ({p.owner.email}{p.owner.phone ? `, ${p.owner.phone}` : ""})
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link href={`/admin/${p.id}`} className="text-xs font-medium text-brand-600 hover:underline">Manage & contract →</Link>
                <AdminPropertyActions propertyId={p.id} status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
