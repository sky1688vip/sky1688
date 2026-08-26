import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { PlayerProfile, User } from "../../drizzle/schema";
import * as db from "../db";
import { getAgentSessionUserId } from "../agentSession";
import { getPlayerSessionProfileId } from "../playerSession";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  player: PlayerProfile | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let player: PlayerProfile | null = null;

  try {
    const agentSessionUserId = await getAgentSessionUserId(opts.req);
    const playerSessionProfileId = agentSessionUserId ? null : await getPlayerSessionProfileId(opts.req);
    if (agentSessionUserId) {
      user = (await db.getUserById(agentSessionUserId)) ?? null;
    } else if (playerSessionProfileId) {
      player = await db.getPlayerProfileById(playerSessionProfileId);
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    player,
  };
}
