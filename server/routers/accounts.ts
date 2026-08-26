import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { agentActivationSchema, agentCreateSchema, agentSuspendSchema } from "../accountSchemas";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

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
      return db.getAgentByUserId(ctx.user.id);
    }),
    activate: protectedProcedure.input(agentActivationSchema).mutation(async ({ ctx, input }) => {
      requireRole("user", ctx.user.role);
      return db.activateProvisionedAgent(input.activationCode, {
        id: ctx.user.id,
        email: ctx.user.email ?? null,
      });
    }),
  }),
});

export const adminAgentsRouter = router({
  list: adminProcedure.query(() => db.listAdminAgents()),
  create: adminProcedure.input(agentCreateSchema).mutation(({ ctx, input }) =>
    db.createProvisionedAgent(input, ctx.user.id),
  ),
  suspend: adminProcedure.input(agentSuspendSchema).mutation(({ input }) => db.suspendAgent(input.id)),
});
