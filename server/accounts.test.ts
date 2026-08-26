import { describe, expect, it, vi } from "vitest";
import { agentActivationSchema, agentCreateSchema } from "./accountSchemas";
import { assertAgentActivationAllowed } from "./accountRules";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createProvisionedAgent: vi.fn(),
  listAdminAgents: vi.fn(),
  suspendAgent: vi.fn(),
  activateProvisionedAgent: vi.fn(),
  getOrCreatePlayerProfile: vi.fn(),
  getPlayerProfile: vi.fn(),
  getAgentByUserId: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

type AppRole = "user" | "agent" | "admin";
const userFactory = (role: AppRole) => ({
  id: role === "admin" ? 1 : role === "agent" ? 2 : 7,
  openId: `${role}-user`,
  email: `${role}@example.com`,
  name: `${role} account`,
  loginMethod: "manus",
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

const contextFactory = (role: AppRole | null): TrpcContext => ({
  user: role ? userFactory(role) : null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("agent provisioning contracts", () => {
  it("normalizes administrator-provisioned agent data", () => {
    const input = agentCreateSchema.parse({ fullName: "Agent One", email: "Agent@Example.COM", phone: " 0912345678 " });
    expect(input).toMatchObject({ email: "agent@example.com", phone: "0912345678" });
    expect(agentActivationSchema.parse({ activationCode: "sky-abcd1234" }).activationCode).toBe("SKY-ABCD1234");
  });

  it("rejects agent management for non-administrators", async () => {
    const caller = appRouter.createCaller(contextFactory("user"));
    await expect(caller.adminAgents.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects invalid, expired, and email-mismatched invitation activation attempts", () => {
    const now = new Date("2026-08-25T00:00:00.000Z");
    const valid = { email: "agent@example.com", status: "invited" as const, activationExpiresAt: new Date("2026-08-26T00:00:00.000Z") };
    expect(() => assertAgentActivationAllowed(undefined, "agent@example.com", now)).toThrow("invalid, expired, or unavailable");
    expect(() => assertAgentActivationAllowed({ ...valid, activationExpiresAt: new Date("2026-08-24T00:00:00.000Z") }, "agent@example.com", now)).toThrow("invalid, expired, or unavailable");
    expect(() => assertAgentActivationAllowed(valid, "other@example.com", now)).toThrow("different email address");
  });

  it("allows an administrator to provision an agent", async () => {
    dbMocks.createProvisionedAgent.mockResolvedValue({ success: true, agentCode: "AG-101", activationCode: "SKY-ABCD1234" });
    const caller = appRouter.createCaller(contextFactory("admin"));
    await expect(caller.adminAgents.create({ fullName: "Agent One", email: "agent@example.com" })).resolves.toMatchObject({ success: true });
    expect(dbMocks.createProvisionedAgent).toHaveBeenCalledWith(expect.objectContaining({ email: "agent@example.com" }), 1);
  });
});

describe("agent activation and player accounts", () => {
  it("allows only a regular authenticated user to activate a provisioned agent account", async () => {
    dbMocks.activateProvisionedAgent.mockResolvedValue({ success: true, status: "active" });
    const caller = appRouter.createCaller(contextFactory("user"));
    await expect(caller.accounts.agent.activate({ activationCode: "SKY-ABCD1234" })).resolves.toMatchObject({ status: "active" });
    expect(dbMocks.activateProvisionedAgent).toHaveBeenCalledWith("SKY-ABCD1234", expect.objectContaining({ id: 7, email: "user@example.com" }));
    const adminCaller = appRouter.createCaller(contextFactory("admin"));
    await expect(adminCaller.accounts.agent.activate({ activationCode: "SKY-ABCD1234" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows only a player-role user to read and explicitly activate a player profile", async () => {
    dbMocks.getOrCreatePlayerProfile.mockResolvedValue({ id: 9, userId: 7, status: "active" });
    dbMocks.getPlayerProfile.mockResolvedValue(null);
    const caller = appRouter.createCaller(contextFactory("user"));
    await expect(caller.accounts.player.me()).resolves.toBeNull();
    await expect(caller.accounts.player.activate()).resolves.toMatchObject({ userId: 7, status: "active" });
    expect(dbMocks.getOrCreatePlayerProfile).toHaveBeenCalledWith(7, "user account");
    const agentCaller = appRouter.createCaller(contextFactory("agent"));
    await expect(agentCaller.accounts.player.me()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
