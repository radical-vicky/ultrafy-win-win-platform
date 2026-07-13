"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({
  propertyId,
  initiallyFavorited = false,
  isLoggedIn,
  className = "",
}: {
  propertyId: string;
  initiallyFavorited?: boolean;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const next = !favorited;
    setFavorited(next); // optimistic
    try {
      if (next) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });
      } else {
        await fetch(`/api/favorites/${propertyId}`, { method: "DELETE" });
      }
    } catch {
      setFavorited(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Remove from saved properties" : "Save property"}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105 ${className}`}
    >
      <span className={favorited ? "text-red-500" : "text-gray-400"}>{favorited ? "♥" : "♡"}</span>
    </button>
  );
}
