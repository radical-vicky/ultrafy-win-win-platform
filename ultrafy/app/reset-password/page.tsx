"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body: any = await res.json().catch(() => ({}));
        let errorMsg = "Could not reset your password.";
        
        if (body.error?.fieldErrors?.password) {
          const passwordErrors = body.error.fieldErrors.password;
          if (Array.isArray(passwordErrors) && passwordErrors.length > 0) {
            errorMsg = passwordErrors[0];
          }
        } else if (body.error) {
          errorMsg = body.error;
        }
        
        throw new Error(errorMsg);
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="glass-card p-8 text-center">
          <p className="text-gray-700">This reset link is missing its token.</p>
          <Link href="/forgot-password" className="mt-4 inline-block font-semibold text-brand-700">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
        {done ? (
          <p className="mt-4 text-sm text-brand-700">Password updated — redirecting you to log in…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label className="label-text">New password</label>
              <input required type="password" minLength={8} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Saving…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
