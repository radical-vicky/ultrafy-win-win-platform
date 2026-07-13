"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type HeroImg = { id: string; url: string; caption?: string | null };

export default function HeroCarousel({ images }: { images: HeroImg[] }) {
  const [active, setActive] = useState(0);
  const slides: Array<HeroImg | { gradient: string }> = images.length > 0 ? images : FALLBACK;

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative isolate flex min-h-[560px] items-center overflow-hidden sm:min-h-[620px]">
      {/* Crossfading background slides */}
      <div className="absolute inset-0">
        {slides.map((slide, i) => (
          <div
            key={"id" in slide ? slide.id : i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? "opacity-100" : "opacity-0"}`}
          >
            {"url" in slide && slide.url ? (
              <Image src={slide.url} alt="" fill priority={i === 0} className="object-cover" sizes="100vw" />
            ) : (
              <div className={`h-full w-full ${(slide as any).gradient}`} />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/70 via-brand-900/55 to-brand-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Free marketing for property owners
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            We fill your building.
            <br />
            <span className="text-brand-200">You connect it with us.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90">
            Ultrafy lists and markets your apartments, offices, or buildings to tenants — completely free.
            In exchange, Ultrafy becomes your building's exclusive fiber internet provider.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary shadow-lg shadow-brand-900/30">List your property, free</Link>
            <Link href="/properties" className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
              See live listings
            </Link>
          </div>
        </div>

        {/* Floating glass stat chips */}
        <div className="mt-12 flex flex-wrap gap-3">
          {[["Free", "Property marketing"], ["1", "Exclusive ISP contract"], ["24h", "Typical review time"]].map(([big, small]) => (
            <div key={small} className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 backdrop-blur-md">
              <p className="text-xl font-bold text-white">{big}</p>
              <p className="text-xs text-white/80">{small}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Shown only if no hero images have been uploaded yet in the admin panel.
const FALLBACK = [
  { gradient: "bg-gradient-to-br from-brand-700 to-brand-900" },
  { gradient: "bg-gradient-to-br from-brand-600 to-brand-800" },
];
