import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { toPlayerSessionProfile } from "../playerProfilePrivacy";
import {
  agentCredentialLoginSchema,
  agentCredentialResetSchema,
  agentCreateSchema,
  agentPasswordChangeSchema,
  agentSuspendSchema,
  playerCredentialLoginSchema,
  playerInviteActivateSchema,
  playerInviteCreateSchema,
  playerInviteRevokeSchema,
  playerAccountStatusSchema,
  playerCredentialResetSchema,
  playerPasswordChangeSchema,
} from "../accountSchemas";
import { AGENT_SESSION_COOKIE, createAgentSession } from "../agentSession";
import { PLAYER_SESSION_COOKIE, createPlayerSession } from "../playerSession";
import { getSessionCookieOptions } from "../_core/cookies";
import { adminProcedure, playerProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

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
    session: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.player) return null;
      const profile = await db.getPlayerProfileById(ctx.player.id);
      return profile ? toPlayerSessionProfile(profile) : null;
    }),
    me: playerProcedure.query(async ({ ctx }) => {
      const profile = await db.getPlayerProfileById(ctx.player.id);
      if (!profile || profile.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Player account is unavailable." });
      return toPlayerSessionProfile(profile);
    }),
    activate: publicProcedure.input(playerInviteActivateSchema).mutation(async ({ ctx, input }) => {
      try {
        const activated = await db.activatePlayerInvitation(input.token, input.playerCode, input.password);
        const token = await createPlayerSession(activated.playerProfileId);
        ctx.res.cookie(PLAYER_SESSION_COOKIE, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 12 * 60 * 60 * 1000,
        });
        return { success: true as const, mustChangePassword: activated.mustChangePassword };
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Player link, Player ID, or password is incorrect, expired, or unavailable.",
        });
      }
    }),
    login: publicProcedure.input(playerCredentialLoginSchema).mutation(async ({ ctx, input }) => {
      try {
        const authenticated = await db.authenticatePlayerCredentials(input.playerCode, input.password);
        const token = await createPlayerSession(authenticated.playerProfileId);
        ctx.res.cookie(PLAYER_SESSION_COOKIE, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 12 * 60 * 60 * 1000,
        });
        return { success: true as const, mustChangePassword: authenticated.mustChangePassword };
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Player ID or password is incorrect, expired, or unavailable.",
        });
      }
    }),
    changePassword: playerProcedure.input(playerPasswordChangeSchema).mutation(async ({ ctx, input }) => {
      return db.changePlayerPassword(ctx.player.id, input.newPassword);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.cookie(PLAYER_SESSION_COOKIE, "", { ...getSessionCookieOptions(ctx.req), maxAge: 0 });
      return { success: true as const };
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
    exitCredentialMode: protectedProcedure.mutation(({ ctx }) => {
      requireRole("agent", ctx.user.role);
      ctx.res.cookie(AGENT_SESSION_COOKIE, "", { ...getSessionCookieOptions(ctx.req), maxAge: 0 });
      return { success: true as const };
    }),
    playerInvites: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        requireRole("agent", ctx.user.role);
        return db.listPlayerInvitationsForAgent(ctx.user.id);
      }),
      create: protectedProcedure.input(playerInviteCreateSchema).mutation(async ({ ctx, input }) => {
        requireRole("agent", ctx.user.role);
        try {
          return await db.createPlayerInvitation(ctx.user.id, input);
        } catch (error) {
          if ((error as Error).message === "PLAYER_CODE_ALREADY_EXISTS") {
            throw new TRPCError({ code: "CONFLICT", message: "This Player ID is already in use. Please choose a different Player ID." });
          }
          throw error;
        }
      }),
      revoke: protectedProcedure.input(playerInviteRevokeSchema).mutation(async ({ ctx, input }) => {
        requireRole("agent", ctx.user.role);
        return db.revokePlayerInvitation(ctx.user.id, input.id);
      }),
      setStatus: protectedProcedure.input(playerAccountStatusSchema).mutation(async ({ ctx, input }) => {
        requireRole("agent", ctx.user.role);
        try {
          return await db.setOwnedPlayerAccountStatus(ctx.user.id, input);
        } catch (error) {
          if ((error as Error).message === "PLAYER_STATUS_CHANGE_UNAVAILABLE") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Only an activated Player can be suspended or reactivated." });
          }
          throw error;
        }
      }),
      resetCredentials: protectedProcedure.input(playerCredentialResetSchema).mutation(async ({ ctx, input }) => {
        requireRole("agent", ctx.user.role);
        return db.resetOwnedPlayerCredentials(ctx.user.id, input);
      }),
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
