"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader, { UploadedImage } from "@/components/ImageUploader";
import { PROPERTY_TYPES, ROOM_TYPES, ROOM_TYPE_LABELS } from "@/types";

type Initial = {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  sizeSqft?: number | null;
  numUnits?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  roomTypes?: string[];
  price?: number | string | null;
  priceType?: string | null;
  images?: UploadedImage[];
};

export default function PropertyForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "APARTMENT",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zipCode: initial?.zipCode ?? "",
    sizeSqft: initial?.sizeSqft?.toString() ?? "",
    numUnits: initial?.numUnits?.toString() ?? "",
    bedrooms: initial?.bedrooms?.toString() ?? "",
    bathrooms: initial?.bathrooms?.toString() ?? "",
    price: initial?.price?.toString() ?? "",
    priceType: initial?.priceType ?? "rent/mo",
  });
  const [roomTypes, setRoomTypes] = useState<string[]>(initial?.roomTypes ?? []);
  const [images, setImages] = useState<UploadedImage[]>(initial?.images ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRoomType(rt: string) {
    setRoomTypes((prev) => (prev.includes(rt) ? prev.filter((r) => r !== rt) : [...prev, rt]));
  }

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        sizeSqft: form.sizeSqft || undefined,
        numUnits: form.numUnits || undefined,
        bedrooms: form.bedrooms || undefined,
        bathrooms: form.bathrooms || undefined,
        price: form.price || undefined,
        roomTypes,
        // In edit mode, images are already persisted live by ImageUploader
        // (each add/remove hits the DB + Cloudinary immediately) — sending
        // them here again would be redundant since PATCH doesn't touch images.
        ...(isEdit ? {} : { images }),
      };
      const res = await fetch(isEdit ? `/api/properties/${initial!.id}` : "/api/properties", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body: any = await res.json().catch(() => ({}));
        throw new Error(body.error?.formErrors?.[0] || body.error || "Could not save the listing.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="label-text">Property title</label>
        <input required className="input-field" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Riverside Apartments — 24 units" />
      </div>

      <div>
        <label className="label-text">Description</label>
        <textarea required rows={4} className="input-field" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell tenants what makes this property great…" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label className="label-text">Type</label>
          <select className="input-field" value={form.type} onChange={(e) => update("type", e.target.value)}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label-text">Size (sqft)</label>
          <input type="number" className="input-field" value={form.sizeSqft} onChange={(e) => update("sizeSqft", e.target.value)} />
        </div>
        <div>
          <label className="label-text"># of units</label>
          <input type="number" className="input-field" value={form.numUnits} onChange={(e) => update("numUnits", e.target.value)} />
        </div>
        <div>
          <label className="label-text">Bedrooms</label>
          <input type="number" min={0} className="input-field" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
        </div>
        <div>
          <label className="label-text">Bathrooms</label>
          <input type="number" min={0} className="input-field" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label-text">Room types</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ROOM_TYPES.map((rt) => (
            <label key={rt} className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={roomTypes.includes(rt)}
                onChange={() => toggleRoomType(rt)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {ROOM_TYPE_LABELS[rt]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label-text">Street address</label>
        <input required className="input-field" value={form.address} onChange={(e) => update("address", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label className="label-text">City</label>
          <input required className="input-field" value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div>
          <label className="label-text">State</label>
          <input required className="input-field" value={form.state} onChange={(e) => update("state", e.target.value)} />
        </div>
        <div>
          <label className="label-text">ZIP</label>
          <input required className="input-field" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Price (optional)</label>
          <input type="number" className="input-field" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="2400" />
        </div>
        <div>
          <label className="label-text">Price label</label>
          <input className="input-field" value={form.priceType} onChange={(e) => update("priceType", e.target.value)} placeholder="rent/mo, sale, lease" />
        </div>
      </div>

      <ImageUploader images={images} onChange={setImages} propertyId={initial?.id} />

      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Submit for review"}
      </button>
    </form>
  );
        }
