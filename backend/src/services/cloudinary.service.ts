import { v2 as cloudinary } from "cloudinary";

let cloudinaryConfigured = false;

function ensureCloudinaryConfig() {
  if (cloudinaryConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not fully configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  cloudinaryConfigured = true;
}

export async function uploadBase64ImageToCloudinary({
  base64,
  folder,
  publicId,
}: {
  base64: string;
  folder: string;
  publicId: string;
}) {
  ensureCloudinaryConfig();

  return cloudinary.uploader.upload(`data:image/png;base64,${base64}`, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  });
}
