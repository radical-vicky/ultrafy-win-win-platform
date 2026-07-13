import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import HeroCarousel from "@/components/HeroCarousel";
import PropertyCard from "@/components/PropertyCard";

export const revalidate = 300;

export default async function HomePage() {
  const session = await getSession();
  const [heroImages, featured, favoriteRows] = await Promise.all([
    prisma.heroImage.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 4 }),
    prisma.property.findMany({
      where: { status: "APPROVED" },
      include: { images: { take: 1, orderBy: { order: "asc" } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    session
      ? prisma.favorite.findMany({ where: { userId: session.userId }, select: { propertyId: true } })
      : Promise.resolve([]),
  ]);
  const favoritedIds = new Set(favoriteRows.map((f) => f.propertyId));

  return (
    <div>
      <HeroCarousel images={heroImages} />

      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="glass-card p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">For property owners — the give</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">We market your property for free</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Professional listing on our public site, built to rank on Google</li>
              <li>• Photos, details, and tenant inquiries handled for you</li>
              <li>• No advertising spend, no listing fees</li>
            </ul>
          </div>
          <div className="glass-card p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">For Ultrafy — the take</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">We become the building's ISP</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Exclusive internet provider agreement for the property</li>
              <li>• First access to every incoming tenant or business</li>
              <li>• A steady pipeline of new fiber customers</li>
            </ul>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Featured properties</h2>
            <Link href="/properties" className="text-sm font-semibold text-brand-700 hover:underline">See all →</Link>
          </div>
          <p className="mt-1 text-sm text-gray-600">Browse freely — create a free account only when you're ready to contact an owner.</p>
          <div className="mt-6 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {featured.map((p) => (
              <PropertyCard
                key={p.id}
                property={{ ...p, price: p.price ? p.price.toString() : null, isFavorited: favoritedIds.has(p.id) }}
                isLoggedIn={Boolean(session)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-4">
          {[
            ["Sign up", "Create an owner account in minutes."],
            ["List your property", "Add details and photos — we handle the rest."],
            ["We approve & promote", "Our team reviews and publishes your listing."],
            ["You fill it, we connect it", "Tenants move in, Ultrafy becomes the ISP."],
          ].map(([title, body], i) => (
            <div key={title} className="glass-card p-5">
              <span className="text-xs font-semibold text-brand-500">Step {i + 1}</span>
              <h3 className="mt-1 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/signup" className="btn-primary">Get started — it's free</Link>
        </div>
      </section>
    </div>
  );
}
