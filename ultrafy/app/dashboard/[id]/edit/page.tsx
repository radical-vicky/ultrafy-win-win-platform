import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import PropertyForm from "@/components/PropertyForm";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const session = await requireOwner();
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!property) notFound();
  if (property.ownerId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit listing</h1>
      <div className="glass-card mt-6 p-6">
        <PropertyForm
          initial={{
            id: property.id,
            title: property.title,
            description: property.description,
            type: property.type,
            address: property.address,
            city: property.city,
            state: property.state,
            zipCode: property.zipCode,
            sizeSqft: property.sizeSqft,
            numUnits: property.numUnits,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            roomTypes: property.roomTypes,
            price: property.price ? property.price.toString() : null,
            priceType: property.priceType,
            images: property.images.map((i) => ({ id: i.id, url: i.url, publicId: i.publicId, type: i.type })),
          }}
        />
      </div>
    </div>
  );
}
