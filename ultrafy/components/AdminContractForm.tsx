"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["DRAFT", "SENT", "SIGNED", "ACTIVE", "EXPIRED", "CANCELLED"] as const;

type ContractData = {
  status: string;
  terms?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
} | null;

function toDateInput(v?: string | null) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

export default function AdminContractForm({ propertyId, initial }: { propertyId: string; initial: ContractData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: initial?.status ?? "DRAFT",
    terms: initial?.terms ?? "",
    notes: initial?.notes ?? "",
    documentUrl: initial?.documentUrl ?? "",
    startDate: toDateInput(initial?.startDate),
    endDate: toDateInput(initial?.endDate),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/properties/${propertyId}/contract`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.formErrors?.[0] || body.error || "Could not save the contract.");
      }
      setSaved(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Exclusive ISP contract</h3>
        {saved && <span className="text-xs font-medium text-brand-600">Saved</span>}
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="label-text">Status</label>
        <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text">Start date</label>
          <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="label-text">End date</label>
          <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label-text">Signed document URL (optional)</label>
        <input className="input-field" placeholder="https://res.cloudinary.com/.../contract.pdf" value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} />
      </div>

      <div>
        <label className="label-text">Terms</label>
        <textarea rows={3} className="input-field" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Exclusivity period, install timeline, revenue share, etc." />
      </div>

      <div>
        <label className="label-text">Internal notes</label>
        <textarea rows={2} className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Not shown to the owner." />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Saving…" : "Save contract"}
      </button>
    </form>
  );
}
