"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [form, setForm] = useState({ email: "", password: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (step !== "otp" || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, cooldown]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Invalid email or password.");
      setCooldown(60);
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not verify that code.");
      if (body.role !== "ADMIN") {
        await fetch("/api/auth/logout", { method: "POST" });
        throw new Error("This account does not have admin access.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, purpose: "LOGIN" }),
    });
    setCooldown(60);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="glass-card p-8">
        {step === "credentials" ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Admin login</h1>
            <p className="mt-1 text-sm text-gray-600">Ultrafy staff access only.</p>

            <form onSubmit={handleCredentials} className="mt-6 space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
              <div>
                <label className="label-text">Email</label>
                <input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Password</label>
                <input required type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Checking…" : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Enter your code</h1>
            <p className="mt-1 text-sm text-gray-600">
              We sent a 6-digit code to <strong>{form.email}</strong>.
            </p>

            <form onSubmit={handleOtp} className="mt-6 space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
              <input
                required
                inputMode="numeric"
                maxLength={6}
                autoFocus
                className="input-field text-center text-lg tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
              />
              <button type="submit" disabled={submitting || code.length !== 6} className="btn-primary w-full">
                {submitting ? "Verifying…" : "Log in"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className="font-semibold text-brand-700 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
