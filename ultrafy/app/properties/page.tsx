import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import PropertyCard from "@/components/PropertyCard";
import { PROPERTY_TYPES, ROOM_TYPES, ROOM_TYPE_LABELS } from "@/types";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Property Listings — Ultrafy Fiber Network" };
export const revalidate = 60;

type SearchParams = {
  city?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  minBathrooms?: string;
  roomTypes?: string | string[];
};

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();

  const selectedRoomTypes = Array.isArray(searchParams.roomTypes)
    ? searchParams.roomTypes
    : searchParams.roomTypes
    ? [searchParams.roomTypes]
    : [];

  const where: Prisma.PropertyWhereInput = { status: "APPROVED" };
  if (searchParams.city) where.city = { equals: searchParams.city, mode: "insensitive" };
  if (searchParams.type) where.type = searchParams.type as Prisma.PropertyWhereInput["type"];
  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {
      ...(searchParams.minPrice ? { gte: Number(searchParams.minPrice) } : {}),
      ...(searchParams.maxPrice ? { lte: Number(searchParams.maxPrice) } : {}),
    };
  }
  if (searchParams.minBedrooms) where.bedrooms = { gte: Number(searchParams.minBedrooms) };
  if (searchParams.minBathrooms) where.bathrooms = { gte: Number(searchParams.minBathrooms) };
  if (selectedRoomTypes.length > 0) {
    where.roomTypes = { hasEvery: selectedRoomTypes as any };
  }

  const [properties, favoriteRows] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    session
      ? prisma.favorite.findMany({ where: { userId: session.userId }, select: { propertyId: true } })
      : Promise.resolve([]),
  ]);
  const favoritedIds = new Set(favoriteRows.map((f) => f.propertyId));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900">Available properties</h1>
      <p className="mt-2 text-gray-600">Every listing here is professionally marketed by Ultrafy, at no cost to the owner.</p>

      <form className="glass-card mt-6 space-y-4 p-4" method="get">
        <div className="flex flex-wrap gap-3">
          <input name="city" defaultValue={searchParams.city} placeholder="City" className="input-field max-w-xs" />
          <select name="type" defaultValue={searchParams.type ?? ""} className="input-field max-w-xs">
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input name="minPrice" type="number" defaultValue={searchParams.minPrice} placeholder="Min price" className="input-field max-w-[9rem]" />
          <input name="maxPrice" type="number" defaultValue={searchParams.maxPrice} placeholder="Max price" className="input-field max-w-[9rem]" />
          <select name="minBedrooms" defaultValue={searchParams.minBedrooms ?? ""} className="input-field max-w-[9rem]">
            <option value="">Any beds</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
          </select>
          <select name="minBathrooms" defaultValue={searchParams.minBathrooms ?? ""} className="input-field max-w-[9rem]">
            <option value="">Any baths</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ baths</option>)}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Must have</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ROOM_TYPES.map((rt) => (
              <label key={rt} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="roomTypes"
                  value={rt}
                  defaultChecked={selectedRoomTypes.includes(rt)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                {ROOM_TYPE_LABELS[rt]}
              </label>
            ))}
          </div>
        </div>

        <button className="btn-secondary" type="submit">Apply filters</button>
      </form>

      {properties.length === 0 ? (
        <div className="glass-card mt-10 p-10 text-center text-gray-500">
          No properties match yet — try loosening your filters, or check back soon.
        </div>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={{ ...p, price: p.price ? p.price.toString() : null, isFavorited: favoritedIds.has(p.id) }}
              isLoggedIn={Boolean(session)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
