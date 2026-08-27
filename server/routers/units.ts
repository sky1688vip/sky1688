import { TRPCError } from "@trpc/server";
import { adminUnitIssueSchema, agentPlayerUnitAdjustmentSchema, agentPlayerUnitTransferSchema } from "../accountSchemas";
import * as db from "../db";
import { adminProcedure, playerProcedure, protectedProcedure, router } from "../_core/trpc";

function requireAgentRole(role: "admin" | "agent" | "user") {
  if (role !== "agent") throw new TRPCError({ code: "FORBIDDEN", message: "Agent account access is required." });
}

function mapUnitError(error: unknown): never {
  const message = (error as Error).message;
  if (message === "AGENT_UNIT_BALANCE_INSUFFICIENT") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Available Units are not sufficient for this Player transfer." });
  }
  if (message === "PLAYER_UNIT_BALANCE_INSUFFICIENT") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This Player does not have enough Units for the requested deduction." });
  }
  if (message === "PLAYER_ACCOUNT_UNAVAILABLE") {
    throw new TRPCError({ code: "NOT_FOUND", message: "This Player is unavailable or does not belong to this Agent." });
  }
  if (message === "AGENT_ACCOUNT_UNAVAILABLE") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This Agent account is unavailable for Unit operations." });
  }
  throw error;
}

export const unitRouter = router({
  admin: router({
    agentBalances: adminProcedure.query(() => db.listAdminAgentUnitBalances()),
    history: adminProcedure.query(() => db.listAdminUnitTransactions()),
    issueToAgent: adminProcedure.input(adminUnitIssueSchema).mutation(async ({ ctx, input }) => {
      try {
        return await db.issueUnitsToAgent(ctx.user.id, input);
      } catch (error) {
        return mapUnitError(error);
      }
    }),
  }),
  agent: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      requireAgentRole(ctx.user.role);
      try {
        return await db.getAgentUnitOverview(ctx.user.id);
      } catch (error) {
        return mapUnitError(error);
      }
    }),
    transferToPlayer: protectedProcedure.input(agentPlayerUnitTransferSchema).mutation(async ({ ctx, input }) => {
      requireAgentRole(ctx.user.role);
      try {
        return await db.transferAgentUnitsToPlayer(ctx.user.id, input);
      } catch (error) {
        return mapUnitError(error);
      }
    }),
    adjustPlayer: protectedProcedure.input(agentPlayerUnitAdjustmentSchema).mutation(async ({ ctx, input }) => {
      requireAgentRole(ctx.user.role);
      try {
        return await db.adjustOwnedPlayerUnits(ctx.user.id, input);
      } catch (error) {
        return mapUnitError(error);
      }
    }),
  }),
  player: router({
    overview: playerProcedure.query(async ({ ctx }) => {
      try {
        return await db.getPlayerUnitOverview(ctx.player.id);
      } catch (error) {
        return mapUnitError(error);
      }
    }),
  }),
});
