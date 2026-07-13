import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Image from "next/image";
import InquiryForm from "@/components/InquiryForm";
import FavoriteButton from "@/components/FavoriteButton";
import { ROOM_TYPE_LABELS } from "@/types";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return {};
  return {
    title: `${property.title} — Ultrafy Fiber Network`,
    description: property.description.slice(0, 155),
  };
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const [property, favorite] = await Promise.all([
    prisma.property.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    session
      ? prisma.favorite.findUnique({ where: { userId_propertyId: { userId: session.userId, propertyId: params.id } } })
      : Promise.resolve(null),
  ]);

  if (!property || property.status !== "APPROVED") notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative">
            <div className="grid gap-3 sm:grid-cols-2">
              {property.images.length > 0 ? (
                property.images.map((img, i) => (
                  <div key={img.id} className={`relative h-64 overflow-hidden rounded-2xl bg-brand-50 ${i === 0 ? "sm:col-span-2" : ""}`}>
                    {img.type === "VIDEO" ? (
                      <video src={img.url} controls playsInline className="h-full w-full object-cover" />
                    ) : (
                      <Image src={img.url} alt={property.title} fill className="object-cover" />
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex h-64 items-center justify-center rounded-2xl bg-brand-50 text-brand-300">
                  No photos yet
                </div>
              )}
            </div>
            <FavoriteButton
              propertyId={property.id}
              initiallyFavorited={Boolean(favorite)}
              isLoggedIn={Boolean(session)}
              className="absolute right-3 top-3"
            />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-brand-600">{property.type}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{property.title}</h1>
          <p className="mt-1 text-gray-500">{property.address}, {property.city}, {property.state} {property.zipCode}</p>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
            {property.price && (
              <span className="font-semibold text-brand-800 text-base">
                ${Number(property.price).toLocaleString()}{property.priceType ? ` ${property.priceType}` : ""}
              </span>
            )}
            {property.sizeSqft && <span>{property.sizeSqft.toLocaleString()} sqft</span>}
            {property.numUnits && <span>{property.numUnits} units</span>}
            {property.bedrooms != null && <span>{property.bedrooms} bedrooms</span>}
            {property.bathrooms != null && <span>{property.bathrooms} bathrooms</span>}
          </div>

          {property.roomTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {property.roomTypes.map((rt) => (
                <span key={rt} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  {ROOM_TYPE_LABELS[rt]}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 whitespace-pre-line text-gray-700">{property.description}</p>
        </div>

        <div className="lg:sticky lg:top-20 lg:h-fit">
          <InquiryForm propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}
