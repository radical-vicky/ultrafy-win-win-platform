"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "tenant" ? "TENANT" : "OWNER";
  const next = searchParams.get("next");

  const [role, setRole] = useState<"OWNER" | "TENANT">(initialRole);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role, termsAccepted }),
      });
      if (!res.ok) {
        const body: any = await res.json().catch(() => ({}));
        throw new Error(body.error?.fieldErrors ? (Object.values(body.error.fieldErrors) as any[])[0]?.[0] : body.error || "Could not create your account.");
      }
      const params = new URLSearchParams({ email: form.email });
      if (next) params.set("next", next);
      router.push(`/verify-email?${params.toString()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === "OWNER" ? "List your property, free" : "Find your next home"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {role === "OWNER" ? "Create an owner account to get started." : "Create a free account to contact property owners."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-brand-50 p-1">
          <button
            type="button"
            onClick={() => setRole("TENANT")}
            className={`rounded-lg py-2 text-sm font-medium transition ${role === "TENANT" ? "bg-white text-brand-800 shadow" : "text-brand-600"}`}
          >
            I'm looking for a property
          </button>
          <button
            type="button"
            onClick={() => setRole("OWNER")}
            className={`rounded-lg py-2 text-sm font-medium transition ${role === "OWNER" ? "bg-white text-brand-800 shadow" : "text-brand-600"}`}
          >
            I'm listing a property
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label-text">Full name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Email</label>
            <input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Phone number</label>
            <input required type="tel" placeholder="+1 555 123 4567" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Password</label>
            <input required type="password" minLength={8} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              I agree to Ultrafy's Terms of Service and Privacy Policy
              {role === "OWNER" && ", and confirm I have the legal right to list the properties I add"}.
              I consent to receive communications about my account and listings.
            </span>
          </label>

          <button type="submit" disabled={submitting || !termsAccepted} className="btn-primary w-full">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="font-semibold text-brand-700">Log in</Link>
        </p>
      </div>
    </div>
  );
}
