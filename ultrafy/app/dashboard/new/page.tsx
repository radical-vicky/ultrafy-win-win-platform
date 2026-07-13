import PropertyForm from "@/components/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">List a new property</h1>
      <p className="mt-1 text-sm text-gray-600">
        Submitted listings go to our team for a quick review before going live.
      </p>
      <div className="glass-card mt-6 p-6">
        <PropertyForm />
      </div>
    </div>
  );
}
