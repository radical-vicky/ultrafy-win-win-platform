"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface VerifyEmailPageProps {
  searchParams: {
    email?: string;
    next?: string;
  };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const router = useRouter();
  const email = searchParams?.email || "";
  const next = searchParams?.next || null;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const body: any = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not verify that code.");
      }
      router.push(next || "/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not resend the code.");
      setResendMessage("A new code is on its way.");
      setCooldown(60);
    } catch (err: any) {
      setResendMessage(err.message);
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="glass-card p-8 text-center">
          <p className="text-gray-700">Missing an email to verify.</p>
          <Link href="/signup" className="mt-4 inline-block font-semibold text-brand-700">Back to sign up</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="mt-1 text-sm text-gray-600">
          We sent a 6-digit code to <strong>{email}</strong>. It expires in 5 minutes.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label-text">Verification code</label>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              className="input-field text-center text-lg tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
            />
          </div>
          <button type="submit" disabled={submitting || code.length !== 6} className="btn-primary w-full">
            {submitting ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {resendMessage && <p className="mb-2 text-gray-600">{resendMessage}</p>}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="font-semibold text-brand-700 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
