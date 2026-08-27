import { COOKIE_NAME } from "@shared/const";
import { AGENT_SESSION_COOKIE } from "./agentSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { accountRouter, adminAgentsRouter } from "./routers/accounts";
import { adminContentRouter, publicContentRouter } from "./routers/content";
import { unitRouter } from "./routers/units";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(AGENT_SESSION_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  content: publicContentRouter,
  adminContent: adminContentRouter,
  accounts: accountRouter,
  adminAgents: adminAgentsRouter,
  units: unitRouter,
});

export type AppRouter = typeof appRouter;
