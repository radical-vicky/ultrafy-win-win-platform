"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

type Contract = {
  status: string;
  terms?: string | null;
  documentUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  signedAt?: string | null;
  ownerSignedName?: string | null;
};

export default function OwnerContractSign({ propertyId, contract }: { propertyId: string; contract: Contract }) {
  const router = useRouter();
  const [typedName, setTypedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/contract/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typedName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.fieldErrors?.typedName?.[0] || body.error || "Could not sign the contract.");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Exclusive fiber-provider agreement</h2>
        <StatusBadge status={contract.status} />
      </div>

      {(contract.startDate || contract.endDate) && (
        <p className="text-sm text-gray-600">
          {contract.startDate && <>Starts {new Date(contract.startDate).toLocaleDateString()}</>}
          {contract.startDate && contract.endDate && " — "}
          {contract.endDate && <>Ends {new Date(contract.endDate).toLocaleDateString()}</>}
        </p>
      )}

      {contract.terms ? (
        <p className="whitespace-pre-line text-sm text-gray-700">{contract.terms}</p>
      ) : (
        <p className="text-sm text-gray-500">Terms will appear here once Ultrafy prepares your agreement.</p>
      )}

      {contract.documentUrl && (
        <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-brand-700 hover:underline">
          View full document →
        </a>
      )}

      {contract.status === "SENT" && (
        <form onSubmit={handleSign} className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-700">
            By typing your full legal name below and clicking "Sign agreement," you agree to make Ultrafy the
            exclusive fiber internet provider for this property under the terms above.
          </p>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <input
            required
            className="input-field"
            placeholder="Type your full legal name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing…" : "Sign agreement"}
          </button>
        </form>
      )}

      {(contract.status === "SIGNED" || contract.status === "ACTIVE") && contract.ownerSignedName && (
        <p className="border-t border-gray-100 pt-4 text-sm text-brand-700">
          Signed by <strong>{contract.ownerSignedName}</strong>
          {contract.signedAt && <> on {new Date(contract.signedAt).toLocaleDateString()}</>}.
        </p>
      )}

      {contract.status === "DRAFT" && (
        <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">
          Ultrafy is still preparing this agreement — you'll be notified by email when it's ready to sign.
        </p>
      )}
    </div>
  );
}
