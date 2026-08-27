import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getPlayerProfileById: vi.fn(), getUserById: vi.fn() }));
const sessionMocks = vi.hoisted(() => ({ getPlayerSessionProfileId: vi.fn(), getAgentSessionUserId: vi.fn() }));
const sdkMocks = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));

vi.mock("../db", () => dbMocks);
vi.mock("../playerSession", () => ({ getPlayerSessionProfileId: sessionMocks.getPlayerSessionProfileId }));
vi.mock("../agentSession", () => ({ getAgentSessionUserId: sessionMocks.getAgentSessionUserId }));
vi.mock("./sdk", () => ({ sdk: sdkMocks }));

import { createContext } from "./context";

const activePlayer = { id: 9, status: "active" as const };
const agentUser = { id: 2, role: "agent" as const };
const contextOptions = { req: { headers: {} }, res: {} } as never;

describe("credential-session context precedence", () => {
  it("uses an active Player session before an existing Agent credential session", async () => {
    sessionMocks.getPlayerSessionProfileId.mockResolvedValue(9);
    sessionMocks.getAgentSessionUserId.mockResolvedValue(2);
    dbMocks.getPlayerProfileById.mockResolvedValue(activePlayer);

    const ctx = await createContext(contextOptions);

    expect(ctx.player).toEqual(activePlayer);
    expect(ctx.user).toBeNull();
    expect(dbMocks.getUserById).not.toHaveBeenCalled();
    expect(sdkMocks.authenticateRequest).not.toHaveBeenCalled();
  });

  it("still uses an Agent credential session when no Player session exists", async () => {
    sessionMocks.getPlayerSessionProfileId.mockResolvedValue(null);
    sessionMocks.getAgentSessionUserId.mockResolvedValue(2);
    dbMocks.getUserById.mockResolvedValue(agentUser);

    const ctx = await createContext(contextOptions);

    expect(ctx.player).toBeNull();
    expect(ctx.user).toEqual(agentUser);
    expect(sdkMocks.authenticateRequest).not.toHaveBeenCalled();
  });
});
