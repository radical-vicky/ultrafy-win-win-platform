"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export type UploadedImage = { id?: string; url: string; publicId: string; type?: "IMAGE" | "VIDEO" };

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  images,
  onChange,
  propertyId,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  /** A real property id means edit mode: uploads/removals/reorders persist immediately. Omit for a new, not-yet-created property. */
  propertyId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const persist = Boolean(propertyId);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: UploadedImage[] = [];
      // Sequential on purpose: keeps upload order predictable and avoids
      // hammering Cloudinary/the DB with a burst of parallel requests
      // when someone multi-selects a large batch of photos/videos.
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const dataUri = await fileToDataUri(file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUri, propertyId: propertyId || "new" }),
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(body.error || `Upload failed${isVideo ? " for video" : ""}`);
        }
        const { url, publicId, type } = await uploadRes.json();

        if (persist) {
          const attachRes = await fetch(`/api/properties/${propertyId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, publicId, type }),
          });
          if (!attachRes.ok) throw new Error("Uploaded, but couldn't save it to the listing.");
          const { image } = await attachRes.json();
          uploaded.push({ id: image.id, url: image.url, publicId: image.publicId, type: image.type });
        } else {
          uploaded.push({ url, publicId, type });
        }
      }
      onChange([...images, ...uploaded]);
    } catch (err: any) {
      setError(err.message || "Something went wrong uploading your files.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(image: UploadedImage) {
    if (persist && image.id) {
      const res = await fetch(`/api/properties/${propertyId}/images/${image.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that item. Please try again.");
        return;
      }
    }
    onChange(images.filter((img) => img.publicId !== image.publicId));
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  async function handleDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === index) return;

    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    onChange(reordered);

    if (persist) {
      const orderedIds = reordered.map((img) => img.id).filter(Boolean) as string[];
      if (orderedIds.length === reordered.length) {
        const res = await fetch(`/api/properties/${propertyId}/images/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        });
        if (!res.ok) setError("Reordered locally, but couldn't save the new order. Try again.");
      }
    }
  }

  return (
    <div>
      <label className="label-text">Photos & videos</label>
      <p className="mb-2 text-xs text-gray-500">Select multiple files at once, then drag thumbnails to reorder. The first item becomes the cover photo.</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, index) => (
          <div
            key={img.publicId}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => setDragOverIndex(null)}
            className={`group relative h-24 cursor-grab overflow-hidden rounded-xl border active:cursor-grabbing ${
              dragOverIndex === index ? "border-brand-500 ring-2 ring-brand-200" : "border-gray-200"
            }`}
          >
            {img.type === "VIDEO" ? (
              <>
                <video src={img.url} className="h-full w-full object-cover" muted />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="rounded-full bg-white/90 p-1.5 text-xs">▶</span>
                </span>
              </>
            ) : (
              <Image src={img.url} alt="" fill className="pointer-events-none object-cover" />
            )}
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-brand-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(img)}
              className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand-200 text-xs font-medium text-brand-600 hover:bg-brand-50">
          {uploading ? "Uploading…" : "+ Add photos/videos"}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
