import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import AdminPropertyActions from "@/components/AdminPropertyActions";
import AdminContractForm from "@/components/AdminContractForm";

export default async function AdminPropertyDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { order: "asc" } },
      owner: true,
      contract: true,
      inquiries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/admin" className="text-sm text-brand-600 hover:underline">← Back to review queue</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
            <StatusBadge status={property.status} />
          </div>
          <p className="mt-1 text-gray-500">{property.address}, {property.city}, {property.state} {property.zipCode}</p>
        </div>
        <AdminPropertyActions propertyId={property.id} status={property.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {property.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {property.images.map((img) => (
                <div key={img.id} className="relative h-24 overflow-hidden rounded-xl bg-brand-50">
                  {img.type === "VIDEO" ? (
                    <video src={img.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <Image src={img.url} alt="" fill className="object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-900">Description</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{property.description}</p>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-900">Owner</h3>
            <p className="mt-2 text-sm text-gray-700">{property.owner.name}</p>
            <p className="text-sm text-gray-500">{property.owner.email}{property.owner.phone ? ` · ${property.owner.phone}` : ""}</p>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-900">Inquiries ({property.inquiries.length})</h3>
            {property.inquiries.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No inquiries yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {property.inquiries.map((inq) => (
                  <li key={inq.id} className="border-t border-gray-100 pt-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{inq.name}</span>
                      <StatusBadge status={inq.status} />
                    </div>
                    <p className="text-gray-500">{inq.email}{inq.phone ? ` · ${inq.phone}` : ""}</p>
                    {inq.message && <p className="mt-1 text-gray-600">{inq.message}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <AdminContractForm
            propertyId={property.id}
            initial={
              property.contract
                ? {
                    status: property.contract.status,
                    terms: property.contract.terms,
                    notes: property.contract.notes,
                    documentUrl: property.contract.documentUrl,
                    startDate: property.contract.startDate?.toISOString() ?? null,
                    endDate: property.contract.endDate?.toISOString() ?? null,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
