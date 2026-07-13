import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

/** Uploads a base64 data URI (from the browser) to Cloudinary. Detects image vs video automatically. */
export async function uploadPropertyImage(
  dataUri: string,
  propertyId: string
): Promise<CloudinaryUploadResult> {
  const isVideo = dataUri.startsWith("data:video/");
  return uploadImage(dataUri, `ultrafy/properties/${propertyId}`, isVideo ? "video" : "image");
}

/** Generic upload to an arbitrary Cloudinary folder (e.g. hero carousel images). */
export async function uploadImage(
  dataUri: string,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
    ...(resourceType === "image"
      ? { transformation: [{ width: 1920, height: 1920, crop: "limit", quality: "auto" }] }
      : { transformation: [{ width: 1280, height: 1280, crop: "limit", quality: "auto" }] }),
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
