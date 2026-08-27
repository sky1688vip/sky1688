import { z } from "zod";
import { PLAYER_HOME_ASSET_SLOTS, type PlayerHomeAssetSlot } from "../shared/playerHomeAssets";

export { PLAYER_HOME_ASSET_LABELS, PLAYER_HOME_ASSET_SLOTS, type PlayerHomeAssetSlot } from "../shared/playerHomeAssets";

export const playerHomeAssetUploadSchema = z.object({
  slot: z.enum(PLAYER_HOME_ASSET_SLOTS),
  altText: z.string().trim().min(2).max(180),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  dataBase64: z.string().trim().min(16).max(7_000_000),
});

export type PlayerHomeAssetUploadInput = z.infer<typeof playerHomeAssetUploadSchema>;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function detectedImageType(bytes: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export function decodePlayerHomeAsset(input: PlayerHomeAssetUploadInput) {
  const normalized = input.dataBase64.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) throw new Error("PLAYER_ASSET_INVALID_ENCODING");
  const bytes = Buffer.from(normalized, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("PLAYER_ASSET_FILE_TOO_LARGE");
  const detectedType = detectedImageType(bytes);
  if (!detectedType || detectedType !== input.contentType) throw new Error("PLAYER_ASSET_INVALID_IMAGE_TYPE");
  return { bytes, contentType: detectedType, extension: detectedType === "image/jpeg" ? "jpg" : detectedType.split("/")[1] };
}
