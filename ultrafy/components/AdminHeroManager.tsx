"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type HeroImg = { id: string; url: string; publicId: string; caption: string | null };

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminHeroManager({ initialImages }: { initialImages: HeroImg[] }) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const dataUri = await fileToDataUri(file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUri, scope: "hero" }),
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url, publicId } = await uploadRes.json();

        const attachRes = await fetch("/api/hero-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, publicId }),
        });
        if (!attachRes.ok) throw new Error("Could not save the hero image");
        const { image } = await attachRes.json();
        setImages((imgs) => [...imgs, image]);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/hero-images/${id}`, { method: "DELETE" });
    setImages((imgs) => imgs.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="glass-card p-6">
      <h2 className="font-semibold text-gray-900">Homepage hero carousel</h2>
      <p className="mt-1 text-sm text-gray-600">
        Upload apartment/building photos to rotate through the homepage hero. Aim for 4+ wide, high-res shots.
      </p>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative h-28 overflow-hidden rounded-xl border border-gray-200">
            <Image src={img.url} alt="" fill className="object-cover" />
            <button
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="flex h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand-200 text-xs font-medium text-brand-600 hover:bg-brand-50">
          {uploading ? "Uploading…" : "+ Add image"}
          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>
    </div>
  );
}
