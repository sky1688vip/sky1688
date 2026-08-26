import { TRPCError } from "@trpc/server";
import * as db from "../db";
import {
  agentCredentialLoginSchema,
  agentCredentialResetSchema,
  agentCreateSchema,
  agentPasswordChangeSchema,
  agentSuspendSchema,
} from "../accountSchemas";
import { AGENT_SESSION_COOKIE, createAgentSession } from "../agentSession";
import { getSessionCookieOptions } from "../_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

function requireRole(role: "agent" | "user", actualRole: "admin" | "agent" | "user") {
  if (actualRole !== role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: role === "agent" ? "Agent account access is required." : "Player account access is required.",
    });
  }
}

export const accountRouter = router({
  player: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      requireRole("user", ctx.user.role);
      return db.getPlayerProfile(ctx.user.id);
    }),
    activate: protectedProcedure.mutation(async ({ ctx }) => {
      requireRole("user", ctx.user.role);
      return db.getOrCreatePlayerProfile(ctx.user.id, ctx.user.name ?? undefined);
    }),
  }),
  agent: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      requireRole("agent", ctx.user.role);
      const agent = await db.getAgentByUserId(ctx.user.id);
      if (!agent || agent.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Agent account is unavailable." });
      }
      return agent;
    }),
    changePassword: protectedProcedure.input(agentPasswordChangeSchema).mutation(async ({ ctx, input }) => {
      requireRole("agent", ctx.user.role);
      return db.changeAgentPassword(ctx.user.id, input.newPassword);
    }),
    login: publicProcedure.input(agentCredentialLoginSchema).mutation(async ({ ctx, input }) => {
      try {
        const authenticated = await db.authenticateAgentCredentials(input.agentCode, input.password);
        const token = await createAgentSession(authenticated.userId);
        ctx.res.cookie(AGENT_SESSION_COOKIE, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 12 * 60 * 60 * 1000,
        });
        return { success: true as const, mustChangePassword: authenticated.mustChangePassword };
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Agent ID or password is incorrect, expired, or unavailable.",
        });
      }
    }),
  }),
});

export const adminAgentsRouter = router({
  list: adminProcedure.query(() => db.listAdminAgents()),
  create: adminProcedure.input(agentCreateSchema).mutation(({ ctx, input }) =>
    db.createProvisionedAgent(input, ctx.user.id),
  ),
  resetCredentials: adminProcedure.input(agentCredentialResetSchema).mutation(({ input }) =>
    db.resetAgentCredentials(input.id),
  ),
  suspend: adminProcedure.input(agentSuspendSchema).mutation(({ input }) => db.suspendAgent(input.id)),
});
