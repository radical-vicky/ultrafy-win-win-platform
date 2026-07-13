import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-brand-100/70 bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Ultrafy Fiber Network. Free marketing, exclusive fiber.</p>
        <div className="flex gap-5">
          <Link href="/properties" className="hover:text-brand-700">Listings</Link>
          <Link href="/signup" className="hover:text-brand-700">List a property</Link>
          <Link href="/admin/login" className="hover:text-brand-700">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
