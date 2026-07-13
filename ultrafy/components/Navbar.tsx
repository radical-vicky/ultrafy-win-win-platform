"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Me = { userId: string; name: string; role: "OWNER" | "ADMIN" } | null;

export default function Navbar() {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .finally(() => setLoaded(true));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">U</span>
          <span className="text-lg tracking-tight">Ultrafy</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 sm:flex">
          <Link href="/properties" className="hover:text-brand-700">Listings</Link>
          {me && (
            <Link href="/favorites" className="hover:text-brand-700">Saved</Link>
          )}
          {me?.role === "OWNER" && (
            <Link href="/dashboard" className="hover:text-brand-700">Dashboard</Link>
          )}
          {me?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-brand-700">Admin</Link>
          )}
          {me?.role === "ADMIN" && (
            <Link href="/admin/users" className="hover:text-brand-700">Users</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!loaded ? null : me ? (
            <>
              <span className="hidden text-sm text-gray-500 sm:inline">Hi, {me.name.split(" ")[0]}</span>
              <Link href="/account/change-password" className="hidden text-sm text-gray-500 hover:text-brand-700 sm:inline">Settings</Link>
              <button onClick={logout} className="btn-secondary !px-4 !py-2">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !px-4 !py-2">Log in</Link>
              <Link href="/signup" className="btn-primary !px-4 !py-2">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
