import Link from "next/link";
import TiltWrapper from "@/components/TiltWrapper";
import FavoriteButton from "@/components/FavoriteButton";

export type PropertyCardData = {
  id: string;
  title: string;
  city: string;
  state: string;
  type: string;
  price?: number | string | null;
  priceType?: string | null;
  numUnits?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  images: { url: string; type?: "IMAGE" | "VIDEO" }[];
  isFeatured?: boolean;
  isFavorited?: boolean;
};

export default function PropertyCard({ property, isLoggedIn = false }: { property: PropertyCardData; isLoggedIn?: boolean }) {
  const cover = property.images[0];

  return (
    <TiltWrapper className="group mb-4 block break-inside-avoid">
      <Link
        href={`/properties/${property.id}`}
        className="glass-card block overflow-hidden shadow-md transition-shadow hover:shadow-2xl hover:shadow-brand-900/10"
      >
        <div className="relative w-full bg-brand-50">
          {cover ? (
            cover.type === "VIDEO" ? (
              <div className="relative">
                <video src={cover.url} className="h-auto max-h-96 w-full object-cover" muted playsInline />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                  <span className="rounded-full bg-white/90 px-2.5 py-1.5 text-sm">▶</span>
                </span>
              </div>
            ) : (
              // Plain <img> (not next/image) on purpose: masonry needs each
              // card's natural aspect ratio, and we don't store intrinsic
              // width/height for uploaded photos to feed next/image sizing.
              <img src={cover.url} alt={property.title} loading="lazy" className="h-auto w-full object-cover" />
            )
          ) : (
            <div className="flex h-40 items-center justify-center text-brand-300 text-sm">No photo yet</div>
          )}
          {property.isFeatured && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
              Featured
            </span>
          )}
          <FavoriteButton
            propertyId={property.id}
            initiallyFavorited={property.isFavorited}
            isLoggedIn={isLoggedIn}
            className="absolute right-3 top-3"
          />
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{property.type}</p>
          <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-brand-700">{property.title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{property.city}, {property.state}</p>
          {(property.bedrooms || property.bathrooms) && (
            <p className="mt-1 text-xs text-gray-500">
              {property.bedrooms ? `${property.bedrooms} bd` : null}
              {property.bedrooms && property.bathrooms ? " · " : null}
              {property.bathrooms ? `${property.bathrooms} ba` : null}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-sm">
            {property.price ? (
              <span className="font-semibold text-brand-800">
                ${Number(property.price).toLocaleString()}{property.priceType ? ` ${property.priceType}` : ""}
              </span>
            ) : <span className="text-gray-400">Price on request</span>}
            {property.numUnits ? <span className="text-gray-500">{property.numUnits} units</span> : null}
          </div>
        </div>
      </Link>
    </TiltWrapper>
  );
}
