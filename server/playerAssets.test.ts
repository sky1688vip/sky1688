import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { decodePlayerHomeAsset, playerHomeAssetUploadSchema } from "./playerHomeAssets";

const dbMocks = vi.hoisted(() => ({
  listPlayerHomeAssets: vi.fn(),
  upsertPlayerHomeAsset: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const validPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JY1sAAAAASUVORK5CYII=";

function contextFactory(role: "user" | "admin"): TrpcContext {
  return {
    user: { id: role === "admin" ? 1 : 2, openId: `${role}-open-id`, email: `${role}@example.com`, name: role, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    player: null,
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: { cookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("Player Home asset contracts", () => {
  const upload = { slot: "hero_banner" as const, altText: "SKY1688 player banner", contentType: "image/png" as const, dataBase64: validPng };

  it("accepts only PNG, JPEG, or WEBP data whose bytes match the declared content type", () => {
    expect(playerHomeAssetUploadSchema.parse(upload).slot).toBe("hero_banner");
    expect(decodePlayerHomeAsset(upload)).toMatchObject({ contentType: "image/png", extension: "png" });
    expect(() => decodePlayerHomeAsset({ ...upload, contentType: "image/jpeg" })).toThrow("PLAYER_ASSET_INVALID_IMAGE_TYPE");
    expect(playerHomeAssetUploadSchema.safeParse({ ...upload, contentType: "image/svg+xml" }).success).toBe(false);
    const oversizedBase64 = Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64");
    expect(() => decodePlayerHomeAsset({ ...upload, dataBase64: oversizedBase64 })).toThrow("PLAYER_ASSET_FILE_TOO_LARGE");
  });

  it("allows public read of safe metadata only but reserves asset upload for an Administrator", async () => {
    dbMocks.listPlayerHomeAssets.mockResolvedValue([{ slot: "hero_banner", imageUrl: "/manus-storage/player-home-assets/banner.png", altText: "Banner", updatedAt: new Date("2026-08-27T00:00:00Z"), storageKey: "private-storage-key", updatedByUserId: 99 }]);
    dbMocks.upsertPlayerHomeAsset.mockResolvedValue({ slot: "hero_banner", imageUrl: "/manus-storage/player-home-assets/banner.png", altText: "Banner" });
    await expect(appRouter.createCaller(contextFactory("user")).playerAssets.list()).resolves.toEqual([{ slot: "hero_banner", imageUrl: "/manus-storage/player-home-assets/banner.png", altText: "Banner", updatedAt: new Date("2026-08-27T00:00:00Z") }]);
    await expect(appRouter.createCaller(contextFactory("user")).adminPlayerAssets.upload(upload)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFactory("admin")).adminPlayerAssets.upload(upload)).resolves.toMatchObject({ slot: "hero_banner" });
    expect(dbMocks.upsertPlayerHomeAsset).toHaveBeenCalledWith(1, upload);
  });

  it("returns a generic bad request when server-side image validation rejects an upload", async () => {
    dbMocks.upsertPlayerHomeAsset.mockRejectedValueOnce(new Error("PLAYER_ASSET_INVALID_IMAGE_TYPE"));
    await expect(appRouter.createCaller(contextFactory("admin")).adminPlayerAssets.upload(upload)).rejects.toMatchObject({ code: "BAD_REQUEST", message: "The selected image could not be accepted." });
  });
});
