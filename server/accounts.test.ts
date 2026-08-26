import { describe, expect, it, vi } from "vitest";
import { agentCredentialLoginSchema, agentCreateSchema, agentPasswordChangeSchema } from "./accountSchemas";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createProvisionedAgent: vi.fn(),
  resetAgentCredentials: vi.fn(),
  listAdminAgents: vi.fn(),
  suspendAgent: vi.fn(),
  authenticateAgentCredentials: vi.fn(),
  changeAgentPassword: vi.fn(),
  getOrCreatePlayerProfile: vi.fn(),
  getPlayerProfile: vi.fn(),
  getAgentByUserId: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({ createAgentSession: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./agentSession", () => ({ AGENT_SESSION_COOKIE: "sky1688_agent_session", createAgentSession: sessionMocks.createAgentSession }));

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

function contextFactory(role: AppRole | null) {
  const cookie = vi.fn();
  const ctx: TrpcContext = {
    user: role ? userFactory(role) : null,
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: { cookie } as TrpcContext["res"],
  };
  return { ctx, cookie };
}

describe("administrator-issued Agent credential contracts", () => {
  it("accepts optional contact email and normalizes supplied credential input", () => {
    const input = agentCreateSchema.parse({ fullName: "Agent One", email: "Agent@Example.COM", phone: " 0912345678 " });
    expect(input).toMatchObject({ email: "agent@example.com", phone: "0912345678" });
    expect(agentCreateSchema.parse({ fullName: "Agent Two" }).email).toBeUndefined();
    expect(agentCredentialLoginSchema.parse({ agentCode: "ag-abc123", password: "long-enough-password" }).agentCode).toBe("AG-ABC123");
    expect(agentPasswordChangeSchema.safeParse({ newPassword: "short" }).success).toBe(false);
  });

  it("rejects Agent management for non-administrators", async () => {
    const { ctx } = contextFactory("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.adminAgents.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to provision and reset credentials without returning a password from list", async () => {
    dbMocks.createProvisionedAgent.mockResolvedValue({ success: true, agentCode: "AG-101", temporaryPassword: "SKY-test-password", temporaryPasswordExpiresAt: new Date() });
    dbMocks.resetAgentCredentials.mockResolvedValue({ success: true, agentCode: "AG-101", temporaryPassword: "SKY-new-password", temporaryPasswordExpiresAt: new Date() });
    const { ctx } = contextFactory("admin");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.adminAgents.create({ fullName: "Agent One" })).resolves.toMatchObject({ success: true, agentCode: "AG-101" });
    expect(dbMocks.createProvisionedAgent).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Agent One" }), 1);
    await expect(caller.adminAgents.resetCredentials({ id: 3 })).resolves.toMatchObject({ temporaryPassword: "SKY-new-password" });
  });
});

describe("Agent credential login and player boundaries", () => {
  it("creates an Agent-only session from valid administrator-issued credentials", async () => {
    dbMocks.authenticateAgentCredentials.mockResolvedValue({ userId: 2, mustChangePassword: true });
    sessionMocks.createAgentSession.mockResolvedValue("signed-agent-session");
    const { ctx, cookie } = contextFactory(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accounts.agent.login({ agentCode: "AG-ABC123", password: "long-enough-password" })).resolves.toEqual({ success: true, mustChangePassword: true });
    expect(dbMocks.authenticateAgentCredentials).toHaveBeenCalledWith("AG-ABC123", "long-enough-password");
    expect(cookie).toHaveBeenCalledWith("sky1688_agent_session", "signed-agent-session", expect.objectContaining({ httpOnly: true }));
  });

  it("allows only an authenticated Agent to change the temporary password and enter an active Agent record", async () => {
    dbMocks.getAgentByUserId.mockResolvedValue({ id: 3, userId: 2, status: "active", mustChangePassword: true });
    dbMocks.changeAgentPassword.mockResolvedValue({ success: true });
    const { ctx } = contextFactory("agent");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accounts.agent.changePassword({ newPassword: "strong-agent-password" })).resolves.toEqual({ success: true });
    await expect(caller.accounts.agent.me()).resolves.toMatchObject({ id: 3, status: "active" });
    const { ctx: userCtx } = contextFactory("user");
    await expect(appRouter.createCaller(userCtx).accounts.agent.changePassword({ newPassword: "strong-agent-password" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("retains explicit Player onboarding for plain user accounts only", async () => {
    dbMocks.getOrCreatePlayerProfile.mockResolvedValue({ id: 9, userId: 7, status: "active" });
    dbMocks.getPlayerProfile.mockResolvedValue(null);
    const { ctx } = contextFactory("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accounts.player.me()).resolves.toBeNull();
    await expect(caller.accounts.player.activate()).resolves.toMatchObject({ userId: 7, status: "active" });
    const { ctx: agentCtx } = contextFactory("agent");
    await expect(appRouter.createCaller(agentCtx).accounts.player.me()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
