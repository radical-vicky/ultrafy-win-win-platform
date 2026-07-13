import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import PropertyCard from "@/components/PropertyCard";

export default async function FavoritesPage() {
  const session = await getSession();

  const favorites = session
    ? await prisma.favorite.findMany({
        where: { userId: session.userId },
        include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const properties = favorites
    .map((f) => f.property)
    .filter((p) => p.status === "APPROVED"); // don't show a saved listing that's since been archived/rejected

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900">Saved properties</h1>
      <p className="mt-2 text-gray-600">Properties you've bookmarked while browsing.</p>

      {properties.length === 0 ? (
        <div className="glass-card mt-10 p-10 text-center text-gray-500">
          Nothing saved yet — tap the heart on any listing to keep it here.
        </div>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={{ ...p, price: p.price ? p.price.toString() : null, isFavorited: true }}
              isLoggedIn
            />
          ))}
        </div>
      )}
    </div>
  );
}
