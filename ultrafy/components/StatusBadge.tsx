const STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-brand-50 text-brand-700 border-brand-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  SENT: "bg-amber-50 text-amber-700 border-amber-200",
  SIGNED: "bg-brand-50 text-brand-700 border-brand-200",
  ACTIVE: "bg-brand-100 text-brand-800 border-brand-300",
  EXPIRED: "bg-gray-100 text-gray-600 border-gray-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  NEW: "bg-amber-50 text-amber-700 border-amber-200",
  CONTACTED: "bg-brand-50 text-brand-700 border-brand-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
