"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Me = { name: string; email: string } | null;

export default function InquiryForm({ propertyId }: { propertyId: string }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me>(null);
  const [checked, setChecked] = useState(false);
  const [form, setForm] = useState({ phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .finally(() => setChecked(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, ...form }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not send your inquiry.");
      }
      setStatus("sent");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (!checked) {
    return <div className="glass-card h-40 animate-pulse p-5" />;
  }

  // Guest view: browse freely, but gate the "contact owner" action —
  // same pattern as Kilimall/most marketplaces gating checkout behind login.
  if (!me) {
    return (
      <div className="glass-card space-y-4 p-5">
        <h3 className="font-semibold text-gray-900">Interested in this property?</h3>
        <p className="text-sm text-gray-600">
          Create a free account or log in to contact the owner and request more information — no cost, just a minute to set up.
        </p>
        <div className="flex flex-col gap-2">
          <Link href={`/signup?role=tenant&next=${encodeURIComponent(pathname)}`} className="btn-primary w-full">
            Sign up to contact owner
          </Link>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-secondary w-full">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="glass-card p-5 text-sm text-brand-800">
        Thanks, {me.name.split(" ")[0]}! Your interest has been sent to the property owner — they'll be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-3 p-5">
      <h3 className="font-semibold text-gray-900">Interested in this property?</h3>
      <p className="text-xs text-gray-500">Sending as {me.name} ({me.email})</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input placeholder="Phone (optional)" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <textarea placeholder="Message (optional)" rows={3} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
        {status === "submitting" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
