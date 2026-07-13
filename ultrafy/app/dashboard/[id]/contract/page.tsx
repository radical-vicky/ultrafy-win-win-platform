import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import OwnerContractSign from "@/components/OwnerContractSign";

export default async function OwnerContractPage({ params }: { params: { id: string } }) {
  const session = await requireOwner();

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { contract: true },
  });
  if (!property) notFound();
  if (property.ownerId !== session.userId) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">← Back to your properties</Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{property.title}</h1>

      <div className="mt-6">
        {property.contract ? (
          <OwnerContractSign
            propertyId={property.id}
            contract={{
              status: property.contract.status,
              terms: property.contract.terms,
              documentUrl: property.contract.documentUrl,
              startDate: property.contract.startDate?.toISOString() ?? null,
              endDate: property.contract.endDate?.toISOString() ?? null,
              signedAt: property.contract.signedAt?.toISOString() ?? null,
              ownerSignedName: property.contract.ownerSignedName,
            }}
          />
        ) : (
          <div className="glass-card p-6 text-sm text-gray-500">
            No fiber contract has been started for this property yet.
          </div>
        )}
      </div>
    </div>
  );
}
