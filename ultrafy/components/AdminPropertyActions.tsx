"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPropertyActions({ propertyId, status }: { propertyId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function approve() {
    setBusy(true);
    await fetch(`/api/properties/${propertyId}/approve`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  async function reject() {
    setBusy(true);
    await fetch(`/api/properties/${propertyId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    setRejecting(false);
    router.refresh();
  }

  if (status === "APPROVED" || status === "REJECTED") {
    return (
      <div className="flex gap-2">
        {status === "REJECTED" && (
          <button onClick={approve} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-xs">Approve anyway</button>
        )}
      </div>
    );
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input-field !py-1.5 text-xs"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={reject} disabled={busy} className="btn-primary !bg-red-600 hover:!bg-red-700 !px-3 !py-1.5 text-xs">Confirm reject</button>
          <button onClick={() => setRejecting(false)} className="btn-secondary !px-3 !py-1.5 text-xs">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} disabled={busy} className="btn-primary !px-3 !py-1.5 text-xs">Approve</button>
      <button onClick={() => setRejecting(true)} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-xs">Reject</button>
    </div>
  );
}
