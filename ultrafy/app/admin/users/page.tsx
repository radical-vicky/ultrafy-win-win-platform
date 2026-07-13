import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import AdminUserActions from "@/components/AdminUserActions";

const TABS = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const status = (searchParams.status && TABS.includes(searchParams.status as any) ? searchParams.status : "PENDING") as (typeof TABS)[number];

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where: { approvalStatus: status, role: { not: "ADMIN" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.groupBy({ by: ["approvalStatus"], where: { role: { not: "ADMIN" } }, _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.approvalStatus === s)?._count ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/admin" className="text-sm text-brand-600 hover:underline">← Back to listing review</Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Account approvals</h1>
      <p className="text-sm text-gray-600">
        New accounts land here after verifying their email. Approval is required before an owner can list a property.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/users?status=${t}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              status === t ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 text-gray-600 hover:bg-brand-50"
            }`}
          >
            {t} ({countFor(t)})
          </Link>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="glass-card mt-8 p-10 text-center text-gray-500">No {status.toLowerCase()} accounts.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {users.map((u) => (
            <div key={u.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{u.name}</h3>
                  <StatusBadge status={u.approvalStatus} />
                  <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500">{u.role}</span>
                  {!u.emailVerified && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      Email not verified yet
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                {u.approvalStatus === "REJECTED" && u.rejectedReason && (
                  <p className="mt-1 text-sm text-red-600">Reason: {u.rejectedReason}</p>
                )}
              </div>
              <AdminUserActions userId={u.id} status={u.approvalStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
