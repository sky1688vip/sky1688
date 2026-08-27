import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { playerHomeAssetUploadSchema } from "../playerHomeAssets";

async function listSafePlayerHomeAssets() {
  return (await db.listPlayerHomeAssets()).map(({ slot, imageUrl, altText, updatedAt }) => ({ slot, imageUrl, altText, updatedAt }));
}

export const playerAssetsRouter = router({
  list: publicProcedure.query(() => listSafePlayerHomeAssets()),
});

export const adminPlayerAssetsRouter = router({
  list: adminProcedure.query(() => listSafePlayerHomeAssets()),
  upload: adminProcedure.input(playerHomeAssetUploadSchema).mutation(async ({ input, ctx }) => {
    try {
      return await db.upsertPlayerHomeAsset(ctx.user.id, input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PLAYER_ASSET_UPLOAD_FAILED";
      if (message.startsWith("PLAYER_ASSET_")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The selected image could not be accepted." });
      }
      throw error;
    }
  }),
});
