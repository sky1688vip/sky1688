import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import * as db from "../db";
import {
  categoryCreateSchema,
  dreamCreateSchema,
  dreamStatusSchema,
  dreamUpdateSchema,
  publicDreamDetailSchema,
  publicDreamListSchema,
  publicResultDetailSchema,
  publicResultsListSchema,
  resultCreateSchema,
  resultStatusSchema,
  resultUpdateSchema,
} from "../contentSchemas";

export const publicContentRouter = router({
  results: router({
    list: publicProcedure.input(publicResultsListSchema).query(({ input }) => db.listPublishedResults(input)),
    detail: publicProcedure.input(publicResultDetailSchema).query(({ input }) => db.getPublishedResult(input.id)),
  }),
  dreams: router({
    categories: publicProcedure.query(() => db.listPublicCategories()),
    list: publicProcedure.input(publicDreamListSchema).query(({ input }) => db.listPublishedDreams(input)),
    detail: publicProcedure.input(publicDreamDetailSchema).query(({ input }) => db.getPublishedDream(input.slug)),
  }),
});

export const adminContentRouter = router({
  overview: adminProcedure.query(() => db.getAdminOverview()),
  categories: router({
    list: adminProcedure.query(() => db.listAdminCategories()),
    create: adminProcedure.input(categoryCreateSchema).mutation(({ input }) => db.createDreamCategory(input)),
  }),
  results: router({
    list: adminProcedure.query(() => db.listAdminResults()),
    create: adminProcedure.input(resultCreateSchema).mutation(({ input, ctx }) =>
      db.createLotteryResult(input, ctx.user.id),
    ),
    update: adminProcedure.input(resultUpdateSchema).mutation(({ input }) => db.updateLotteryResult(input)),
    setStatus: adminProcedure.input(resultStatusSchema).mutation(({ input }) =>
      db.setLotteryResultStatus(input.id, input.status),
    ),
  }),
  dreams: router({
    list: adminProcedure.query(() => db.listAdminDreams()),
    create: adminProcedure.input(dreamCreateSchema).mutation(({ input, ctx }) =>
      db.createDreamEntry(input, ctx.user.id),
    ),
    update: adminProcedure.input(dreamUpdateSchema).mutation(({ input }) => db.updateDreamEntry(input)),
    setStatus: adminProcedure.input(dreamStatusSchema).mutation(({ input }) =>
      db.setDreamEntryStatus(input.id, input.status),
    ),
  }),
});
