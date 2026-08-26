import { describe, expect, it, vi } from "vitest";
import {
  agentCredentialLoginSchema,
  agentCreateSchema,
  agentPasswordChangeSchema,
  playerCredentialLoginSchema,
  playerInviteActivateSchema,
  playerInviteCreateSchema,
} from "./accountSchemas";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createProvisionedAgent: vi.fn(),
  resetAgentCredentials: vi.fn(),
  listAdminAgents: vi.fn(),
  suspendAgent: vi.fn(),
  authenticateAgentCredentials: vi.fn(),
  changeAgentPassword: vi.fn(),
  getAgentByUserId: vi.fn(),
  createPlayerInvitation: vi.fn(),
  listPlayerInvitationsForAgent: vi.fn(),
  revokePlayerInvitation: vi.fn(),
  activatePlayerInvitation: vi.fn(),
  authenticatePlayerCredentials: vi.fn(),
  changePlayerPassword: vi.fn(),
  getPlayerProfileById: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({ createAgentSession: vi.fn(), createPlayerSession: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./agentSession", () => ({ AGENT_SESSION_COOKIE: "sky1688_agent_session", createAgentSession: sessionMocks.createAgentSession }));
vi.mock("./playerSession", () => ({ PLAYER_SESSION_COOKIE: "sky1688_player_session", createPlayerSession: sessionMocks.createPlayerSession }));

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

const playerProfile = {
  id: 9,
  userId: null,
  agentId: 3,
  invitationId: 12,
  displayName: null,
  playerCode: "PL-ABC12345",
  passwordHash: "hash",
  passwordSalt: "salt",
  mustChangePassword: true,
  temporaryPasswordExpiresAt: new Date(Date.now() + 60_000),
  failedLoginCount: 0,
  lockedUntil: null,
  credentialIssuedAt: new Date(),
  lastCredentialLoginAt: new Date(),
  activatedAt: new Date(),
  status: "active" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function contextFactory(role: AppRole | null, player: typeof playerProfile | null = null) {
  const cookie = vi.fn();
  const ctx = {
    user: role ? userFactory(role) : null,
    player,
    req: { headers: {}, protocol: "https" },
    res: { cookie },
  } as unknown as TrpcContext;
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
    await expect(appRouter.createCaller(ctx).adminAgents.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
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

describe("Agent-issued Player credential boundaries", () => {
  const playerCreateInput = {
    playerCode: "pl_agent_001",
    password: "p".repeat(24),
    phone: "0912345678",
    bankAccountName: "Player Name",
    bankType: "KBZ Bank",
    streamerAccount: "မရှိပါ",
    bankAccountNumber: "1234 5678 9012",
  };

  it("creates an Agent-only session from valid administrator-issued credentials", async () => {
    dbMocks.authenticateAgentCredentials.mockResolvedValue({ userId: 2, mustChangePassword: true });
    sessionMocks.createAgentSession.mockResolvedValue("signed-agent-session");
    const { ctx, cookie } = contextFactory(null);
    await expect(appRouter.createCaller(ctx).accounts.agent.login({ agentCode: "AG-ABC123", password: "long-enough-password" })).resolves.toEqual({ success: true, mustChangePassword: true });
    expect(cookie).toHaveBeenCalledWith("sky1688_agent_session", "signed-agent-session", expect.objectContaining({ httpOnly: true }));
  });

  it("allows only an authenticated Agent to issue, list, and revoke Player credentials", async () => {
    const issue = { success: true, token: "x".repeat(40), playerCode: "PL-ABC12345", temporaryPassword: "p".repeat(24), expiresAt: new Date() };
    dbMocks.createPlayerInvitation.mockResolvedValue(issue);
    dbMocks.listPlayerInvitationsForAgent.mockResolvedValue([{ id: 12, playerCode: issue.playerCode, status: "issued" }]);
    dbMocks.revokePlayerInvitation.mockResolvedValue({ success: true });
    const { ctx: agentCtx } = contextFactory("agent");
    const agentCaller = appRouter.createCaller(agentCtx);
    const parsedCreateInput = playerInviteCreateSchema.parse(playerCreateInput);
    expect(parsedCreateInput).toMatchObject({ playerCode: "PL_AGENT_001", bankAccountNumber: "123456789012" });
    expect(playerInviteCreateSchema.safeParse({ ...playerCreateInput, playerCode: "player id" }).success).toBe(false);
    await expect(agentCaller.accounts.agent.playerInvites.create(playerCreateInput)).resolves.toMatchObject({ playerCode: issue.playerCode, temporaryPassword: issue.temporaryPassword });
    expect(dbMocks.createPlayerInvitation).toHaveBeenCalledWith(2, expect.objectContaining({ playerCode: "PL_AGENT_001", bankAccountNumber: "123456789012" }));
    dbMocks.createPlayerInvitation.mockRejectedValueOnce(new Error("PLAYER_CODE_ALREADY_EXISTS"));
    await expect(agentCaller.accounts.agent.playerInvites.create(playerCreateInput)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("Player ID is already in use") });
    await expect(agentCaller.accounts.agent.playerInvites.list()).resolves.toHaveLength(1);
    await expect(agentCaller.accounts.agent.playerInvites.revoke({ id: 12 })).resolves.toEqual({ success: true });
    const { ctx: plainUserCtx } = contextFactory("user");
    await expect(appRouter.createCaller(plainUserCtx).accounts.agent.playerInvites.create(playerCreateInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires an Agent link plus issued Player ID and password, then creates only a Player session", async () => {
    const token = "x".repeat(40);
    const password = "p".repeat(24);
    expect(playerInviteActivateSchema.safeParse({ token, playerCode: "PL-ABC12345", password }).success).toBe(true);
    expect(playerInviteActivateSchema.safeParse({ token, playerCode: "PL-ABC12345" }).success).toBe(false);
    expect(playerCredentialLoginSchema.parse({ playerCode: "pl-abc12345", password }).playerCode).toBe("PL-ABC12345");
    dbMocks.activatePlayerInvitation.mockResolvedValue({ playerProfileId: 9, mustChangePassword: true });
    sessionMocks.createPlayerSession.mockResolvedValue("signed-player-session");
    const { ctx, cookie } = contextFactory(null);
    await expect(appRouter.createCaller(ctx).accounts.player.activate({ token, playerCode: "PL-ABC12345", password })).resolves.toEqual({ success: true, mustChangePassword: true });
    expect(dbMocks.activatePlayerInvitation).toHaveBeenCalledWith(token, "PL-ABC12345", password);
    expect(cookie).toHaveBeenCalledWith("sky1688_player_session", "signed-player-session", expect.objectContaining({ httpOnly: true }));
  });

  it("allows Player profile and password access only through the dedicated Player session", async () => {
    dbMocks.getPlayerProfileById.mockResolvedValue(playerProfile);
    dbMocks.changePlayerPassword.mockResolvedValue({ success: true });
    const { ctx } = contextFactory(null, playerProfile);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accounts.player.me()).resolves.toMatchObject({ id: 9, playerCode: "PL-ABC12345" });
    await expect(caller.accounts.player.changePassword({ newPassword: "strong-player-password" })).resolves.toEqual({ success: true });
    await expect(caller.accounts.player.session()).resolves.toMatchObject({ id: 9 });
    const { ctx: agentCtx } = contextFactory("agent");
    await expect(appRouter.createCaller(agentCtx).accounts.player.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
