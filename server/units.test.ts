import { describe, expect, it, vi } from "vitest";
import { adminUnitIssueSchema, agentPlayerUnitAdjustmentSchema, agentPlayerUnitTransferSchema } from "./accountSchemas";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  listAdminAgentUnitBalances: vi.fn(),
  listAdminUnitTransactions: vi.fn(),
  issueUnitsToAgent: vi.fn(),
  getAgentUnitOverview: vi.fn(),
  getPlayerUnitOverview: vi.fn(),
  transferAgentUnitsToPlayer: vi.fn(),
  adjustOwnedPlayerUnits: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

type AppRole = "user" | "agent" | "admin";
const userFactory = (role: AppRole) => ({
  id: role === "admin" ? 1 : role === "agent" ? 2 : 7,
  openId: `${role}-user`,
  email: `${role}@example.com`,
  name: `${role} account`,
  loginMethod: "credential",
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

function contextFactory(role: AppRole, player: { id: number; status: "active" } | null = null) {
  return {
    user: userFactory(role),
    player,
    req: { headers: {}, protocol: "https" },
    res: { cookie: vi.fn() },
  } as unknown as TrpcContext;
}

describe("internal Unit ledger contracts", () => {
  const issueInput = { agentId: 3, amount: 250, note: "opening allocation" };
  const transferInput = { playerProfileId: 9, amount: 40, note: "Player allocation" };
  const adjustmentInput = { playerProfileId: 9, direction: "debit" as const, amount: 20, note: "Correct duplicate credit" };

  it("accepts only positive bounded Unit amounts", () => {
    expect(adminUnitIssueSchema.parse(issueInput)).toMatchObject(issueInput);
    expect(agentPlayerUnitTransferSchema.parse(transferInput)).toMatchObject(transferInput);
    expect(agentPlayerUnitAdjustmentSchema.parse(adjustmentInput)).toMatchObject(adjustmentInput);
    expect(adminUnitIssueSchema.safeParse({ ...issueInput, amount: 0 }).success).toBe(false);
    expect(agentPlayerUnitTransferSchema.safeParse({ ...transferInput, amount: 1_000_001 }).success).toBe(false);
  });

  it("allows only an Administrator to issue Units to an Agent", async () => {
    dbMocks.issueUnitsToAgent.mockResolvedValue({ success: true, agentId: 3, availableUnits: 250 });
    const adminCaller = appRouter.createCaller(contextFactory("admin"));
    await expect(adminCaller.units.admin.issueToAgent(issueInput)).resolves.toMatchObject({ availableUnits: 250 });
    expect(dbMocks.issueUnitsToAgent).toHaveBeenCalledWith(1, issueInput);
    const agentCaller = appRouter.createCaller(contextFactory("agent"));
    await expect(agentCaller.units.admin.issueToAgent(issueInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an Agent to transfer Units only through the Agent procedure and reports insufficient balance safely", async () => {
    dbMocks.transferAgentUnitsToPlayer.mockResolvedValue({ success: true, playerProfileId: 9, agentAvailableUnits: 210, playerAvailableUnits: 40 });
    const agentCaller = appRouter.createCaller(contextFactory("agent"));
    await expect(agentCaller.units.agent.transferToPlayer(transferInput)).resolves.toMatchObject({ playerAvailableUnits: 40 });
    expect(dbMocks.transferAgentUnitsToPlayer).toHaveBeenCalledWith(2, transferInput);
    dbMocks.transferAgentUnitsToPlayer.mockRejectedValueOnce(new Error("AGENT_UNIT_BALANCE_INSUFFICIENT"));
    await expect(agentCaller.units.agent.transferToPlayer(transferInput)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("not sufficient") });
    const adminCaller = appRouter.createCaller(contextFactory("admin"));
    await expect(adminCaller.units.agent.transferToPlayer(transferInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an Agent-only Player Unit adjustment with an auditable reason and maps insufficient Player balance safely", async () => {
    dbMocks.adjustOwnedPlayerUnits.mockResolvedValue({ success: true, direction: "debit", playerProfileId: 9, agentAvailableUnits: 230, playerAvailableUnits: 20 });
    const agentCaller = appRouter.createCaller(contextFactory("agent"));
    await expect(agentCaller.units.agent.adjustPlayer(adjustmentInput)).resolves.toMatchObject({ playerAvailableUnits: 20 });
    expect(dbMocks.adjustOwnedPlayerUnits).toHaveBeenCalledWith(2, adjustmentInput);
    expect(agentPlayerUnitAdjustmentSchema.safeParse({ ...adjustmentInput, note: "x" }).success).toBe(false);
    dbMocks.adjustOwnedPlayerUnits.mockRejectedValueOnce(new Error("PLAYER_UNIT_BALANCE_INSUFFICIENT"));
    await expect(agentCaller.units.agent.adjustPlayer(adjustmentInput)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("does not have enough") });
    const adminCaller = appRouter.createCaller(contextFactory("admin"));
    await expect(adminCaller.units.agent.adjustPlayer(adjustmentInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("provides only the authenticated Player's read-only Unit overview", async () => {
    dbMocks.getPlayerUnitOverview.mockResolvedValue({ availableUnits: 40, transactions: [] });
    const playerCaller = appRouter.createCaller(contextFactory("user", { id: 9, status: "active" }));
    await expect(playerCaller.units.player.overview()).resolves.toEqual({ availableUnits: 40, transactions: [] });
    expect(dbMocks.getPlayerUnitOverview).toHaveBeenCalledWith(9);
    const plainCaller = appRouter.createCaller(contextFactory("user"));
    await expect(plainCaller.units.player.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
