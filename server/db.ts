import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { createCipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agents,
  dreamCategories,
  dreamEntries,
  InsertUser,
  lotteryResults,
  playerAccountEvents,
  playerHomeAssets,
  playerInvitations,
  playerProfiles,
  unitBalances,
  unitTransactions,
  users,
} from "../drizzle/schema";
import type {
  DreamCreateInput,
  DreamUpdateInput,
  ResultCreateInput,
  ResultUpdateInput,
} from "./contentSchemas";
import type { AdminUnitIssueInput, AgentCreateInput, AgentPlayerUnitAdjustmentInput, AgentPlayerUnitTransferInput, PlayerAccountStatusInput, PlayerCredentialResetInput, PlayerInviteCreateInput } from "./accountSchemas";
import { ENV } from "./_core/env";
import { toAgentVisiblePlayerInvitation } from "./playerProfilePrivacy";
import { decodePlayerHomeAsset, type PlayerHomeAssetUploadInput } from "./playerHomeAssets";
import { storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  const requestedRole = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : undefined);
  if (requestedRole) {
    values.role = requestedRole;
    updateSet.role = requestedRole;
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listPlayerHomeAssets() {
  const db = await requireDb();
  return db
    .select({
      slot: playerHomeAssets.slot,
      imageUrl: playerHomeAssets.imageUrl,
      altText: playerHomeAssets.altText,
      updatedAt: playerHomeAssets.updatedAt,
    })
    .from(playerHomeAssets)
    .orderBy(playerHomeAssets.slot);
}

export async function upsertPlayerHomeAsset(adminUserId: number, input: PlayerHomeAssetUploadInput) {
  const db = await requireDb();
  const image = decodePlayerHomeAsset(input);
  const uploaded = await storagePut(
    `player-home-assets/${input.slot}_${Date.now()}.${image.extension}`,
    image.bytes,
    image.contentType,
  );
  await db
    .insert(playerHomeAssets)
    .values({
      slot: input.slot,
      storageKey: uploaded.key,
      imageUrl: uploaded.url,
      altText: input.altText,
      updatedByUserId: adminUserId,
    })
    .onDuplicateKeyUpdate({
      set: {
        storageKey: uploaded.key,
        imageUrl: uploaded.url,
        altText: input.altText,
        updatedByUserId: adminUserId,
      },
    });
  return { slot: input.slot, imageUrl: uploaded.url, altText: input.altText };
}

export async function listPublicCategories() {
  const db = await requireDb();
  return db
    .select()
    .from(dreamCategories)
    .where(eq(dreamCategories.isActive, true))
    .orderBy(dreamCategories.sortOrder, dreamCategories.name);
}

export async function listPublishedResults({ gameType, limit }: { gameType?: "2d" | "3d"; limit: number }) {
  const db = await requireDb();
  return db
    .select()
    .from(lotteryResults)
    .where(
      and(
        eq(lotteryResults.status, "published"),
        gameType ? eq(lotteryResults.gameType, gameType) : undefined,
      ),
    )
    .orderBy(desc(lotteryResults.drawAt))
    .limit(limit);
}

export async function getPublishedResult(id: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(lotteryResults)
    .where(and(eq(lotteryResults.id, id), eq(lotteryResults.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

export async function listPublishedDreams({
  search,
  categorySlug,
  limit,
}: {
  search?: string;
  categorySlug?: string;
  limit: number;
}) {
  const db = await requireDb();
  const searchTerm = search ? `%${search}%` : undefined;
  return db
    .select({
      id: dreamEntries.id,
      slug: dreamEntries.slug,
      title: dreamEntries.title,
      summary: dreamEntries.summary,
      luckyNumbers: dreamEntries.luckyNumbers,
      imageUrl: dreamEntries.imageUrl,
      publishedAt: dreamEntries.publishedAt,
      categoryName: dreamCategories.name,
      categorySlug: dreamCategories.slug,
    })
    .from(dreamEntries)
    .leftJoin(dreamCategories, eq(dreamEntries.categoryId, dreamCategories.id))
    .where(
      and(
        eq(dreamEntries.status, "published"),
        categorySlug ? eq(dreamCategories.slug, categorySlug) : undefined,
        searchTerm
          ? or(
              like(dreamEntries.title, searchTerm),
              like(dreamEntries.summary, searchTerm),
              like(dreamEntries.luckyNumbers, searchTerm),
            )
          : undefined,
      ),
    )
    .orderBy(desc(dreamEntries.publishedAt), desc(dreamEntries.id))
    .limit(limit);
}

export async function getPublishedDream(slug: string) {
  const db = await requireDb();
  const rows = await db
    .select({
      id: dreamEntries.id,
      slug: dreamEntries.slug,
      title: dreamEntries.title,
      summary: dreamEntries.summary,
      meaning: dreamEntries.meaning,
      luckyNumbers: dreamEntries.luckyNumbers,
      imageUrl: dreamEntries.imageUrl,
      publishedAt: dreamEntries.publishedAt,
      categoryName: dreamCategories.name,
      categorySlug: dreamCategories.slug,
    })
    .from(dreamEntries)
    .leftJoin(dreamCategories, eq(dreamEntries.categoryId, dreamCategories.id))
    .where(and(eq(dreamEntries.slug, slug), eq(dreamEntries.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

export async function listAdminCategories() {
  const db = await requireDb();
  return db.select().from(dreamCategories).orderBy(dreamCategories.sortOrder, dreamCategories.name);
}

export async function createDreamCategory(input: { slug: string; name: string; description?: string }) {
  const db = await requireDb();
  await db.insert(dreamCategories).values({
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
  });
  return { success: true };
}

export async function listAdminResults() {
  const db = await requireDb();
  return db.select().from(lotteryResults).orderBy(desc(lotteryResults.drawAt), desc(lotteryResults.id));
}

export async function createLotteryResult(input: ResultCreateInput, userId: number) {
  const db = await requireDb();
  await db.insert(lotteryResults).values({
    ...input,
    note: input.note ?? null,
    sourceLabel: input.sourceLabel ?? null,
    drawAt: input.drawAt,
    publishedAt: input.status === "published" ? new Date() : null,
    createdByUserId: userId,
  });
  return { success: true };
}

export async function updateLotteryResult(input: ResultUpdateInput) {
  const db = await requireDb();
  await db
    .update(lotteryResults)
    .set({
      gameType: input.gameType,
      resultNumber: input.resultNumber,
      title: input.title,
      note: input.note ?? null,
      sourceLabel: input.sourceLabel ?? null,
      drawAt: input.drawAt,
      status: input.status,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .where(eq(lotteryResults.id, input.id));
  return { success: true };
}

export async function setLotteryResultStatus(id: number, status: "draft" | "published" | "archived") {
  const db = await requireDb();
  await db
    .update(lotteryResults)
    .set({ status, publishedAt: status === "published" ? new Date() : null })
    .where(eq(lotteryResults.id, id));
  return { success: true };
}

export async function listAdminDreams() {
  const db = await requireDb();
  return db
    .select({ entry: dreamEntries, categoryName: dreamCategories.name })
    .from(dreamEntries)
    .leftJoin(dreamCategories, eq(dreamEntries.categoryId, dreamCategories.id))
    .orderBy(desc(dreamEntries.updatedAt), desc(dreamEntries.id));
}

export async function createDreamEntry(input: DreamCreateInput, userId: number) {
  const db = await requireDb();
  await db.insert(dreamEntries).values({
    categoryId: input.categoryId ?? null,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    meaning: input.meaning,
    luckyNumbers: input.luckyNumbers,
    imageUrl: input.imageUrl || null,
    status: input.status,
    publishedAt: input.status === "published" ? new Date() : null,
    createdByUserId: userId,
  });
  return { success: true };
}

export async function updateDreamEntry(input: DreamUpdateInput) {
  const db = await requireDb();
  await db
    .update(dreamEntries)
    .set({
      categoryId: input.categoryId ?? null,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      meaning: input.meaning,
      luckyNumbers: input.luckyNumbers,
      imageUrl: input.imageUrl || null,
      status: input.status,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .where(eq(dreamEntries.id, input.id));
  return { success: true };
}

export async function setDreamEntryStatus(id: number, status: "draft" | "published" | "archived") {
  const db = await requireDb();
  await db
    .update(dreamEntries)
    .set({ status, publishedAt: status === "published" ? new Date() : null })
    .where(eq(dreamEntries.id, id));
  return { success: true };
}

export async function getAdminOverview() {
  const db = await requireDb();
  const [resultCount] = await db.select({ total: count() }).from(lotteryResults);
  const [dreamCount] = await db.select({ total: count() }).from(dreamEntries);
  const [categoryCount] = await db.select({ total: count() }).from(dreamCategories);
  return {
    results: resultCount?.total ?? 0,
    dreams: dreamCount?.total ?? 0,
    categories: categoryCount?.total ?? 0,
  };
}

const randomCode = (prefix: string, bytes: number) => `${prefix}-${randomBytes(bytes).toString("hex").toUpperCase()}`;
const temporaryPasswordLifetimeMs = 24 * 60 * 60 * 1000;
const loginLockoutMs = 15 * 60 * 1000;
const maxFailedLoginAttempts = 5;
const playerInviteLifetimeMs = 72 * 60 * 60 * 1000;
const playerTemporaryPasswordLifetimeMs = playerInviteLifetimeMs;

function createTemporaryPassword() {
  return `SKY-${randomBytes(18).toString("base64url")}`;
}

function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

function passwordMatches(password: string, salt: string, storedHash: string) {
  const calculated = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  return expected.length === calculated.length && timingSafeEqual(expected, calculated);
}

function createPlayerInviteToken() {
  return randomBytes(32).toString("base64url");
}

function hashPlayerInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function encryptBankAccountNumber(value: string) {
  if (!ENV.cookieSecret) throw new Error("PLAYER_BANK_ENCRYPTION_UNAVAILABLE");
  const key = createHash("sha256").update(ENV.cookieSecret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export async function listAdminAgents() {
  const db = await requireDb();
  return db
    .select({ agent: agents, activatedUserName: users.name, activatedUserEmail: users.email })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .orderBy(desc(agents.updatedAt), desc(agents.id));
}

export async function createProvisionedAgent(input: AgentCreateInput, createdByUserId: number) {
  const db = await requireDb();
  const agentCode = randomCode("AG", 4);
  const temporaryPassword = createTemporaryPassword();
  const password = createPasswordHash(temporaryPassword);
  const temporaryPasswordExpiresAt = new Date(Date.now() + temporaryPasswordLifetimeMs);
  const now = new Date();
  await db.transaction(async tx => {
    await tx.insert(users).values({
      openId: `agent:${agentCode}`,
      name: input.fullName,
      email: input.email ?? null,
      loginMethod: "agent-credential",
      role: "agent",
      lastSignedIn: now,
    });
    const linkedUser = await tx.select().from(users).where(eq(users.openId, `agent:${agentCode}`)).limit(1);
    const user = linkedUser[0];
    if (!user) throw new Error("AGENT_USER_CREATE_FAILED");
    await tx.insert(agents).values({
      userId: user.id,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      agentCode,
      status: "invited",
      passwordHash: password.hash,
      passwordSalt: password.salt,
      mustChangePassword: true,
      temporaryPasswordExpiresAt,
      failedLoginCount: 0,
      credentialIssuedAt: now,
      createdByUserId,
    });
  });
  return { success: true as const, agentCode, temporaryPassword, temporaryPasswordExpiresAt };
}

export async function suspendAgent(id: number) {
  const db = await requireDb();
  await db.update(agents).set({ status: "suspended", suspendedAt: new Date() }).where(eq(agents.id, id));
  return { success: true as const };
}

export async function authenticateAgentCredentials(agentCode: string, password: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.agentCode, agentCode.trim().toUpperCase()))
    .limit(1);
  const agent = rows[0];
  if (!agent || !agent.userId || !agent.passwordHash || !agent.passwordSalt || agent.status === "suspended") {
    throw new Error("INVALID_AGENT_CREDENTIALS");
  }
  const now = new Date();
  if (agent.lockedUntil && agent.lockedUntil > now) throw new Error("AGENT_CREDENTIALS_LOCKED");
  if (agent.mustChangePassword && agent.temporaryPasswordExpiresAt && agent.temporaryPasswordExpiresAt <= now) {
    throw new Error("TEMPORARY_PASSWORD_EXPIRED");
  }
  if (!passwordMatches(password, agent.passwordSalt, agent.passwordHash)) {
    const failedLoginCount = agent.failedLoginCount + 1;
    await db.update(agents).set({
      failedLoginCount,
      lockedUntil: failedLoginCount >= maxFailedLoginAttempts ? new Date(now.getTime() + loginLockoutMs) : null,
    }).where(eq(agents.id, agent.id));
    throw new Error("INVALID_AGENT_CREDENTIALS");
  }
  await db.transaction(async tx => {
    await tx.update(agents).set({
      status: "active",
      activatedAt: agent.activatedAt ?? now,
      suspendedAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
      lastCredentialLoginAt: now,
    }).where(eq(agents.id, agent.id));
    await tx.update(users).set({ lastSignedIn: now, role: "agent" }).where(eq(users.id, agent.userId!));
  });
  return { userId: agent.userId, mustChangePassword: agent.mustChangePassword };
}

export async function changeAgentPassword(userId: number, newPassword: string) {
  const db = await requireDb();
  const agent = await getAgentByUserId(userId);
  if (!agent || agent.status !== "active") throw new Error("AGENT_ACCOUNT_UNAVAILABLE");
  const password = createPasswordHash(newPassword);
  await db.update(agents).set({
    passwordHash: password.hash,
    passwordSalt: password.salt,
    mustChangePassword: false,
    temporaryPasswordExpiresAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
  }).where(eq(agents.id, agent.id));
  return { success: true as const };
}

export async function resetAgentCredentials(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  const agent = rows[0];
  if (!agent || agent.status === "suspended") throw new Error("AGENT_ACCOUNT_UNAVAILABLE");
  const temporaryPassword = createTemporaryPassword();
  const password = createPasswordHash(temporaryPassword);
  const temporaryPasswordExpiresAt = new Date(Date.now() + temporaryPasswordLifetimeMs);
  await db.update(agents).set({
    passwordHash: password.hash,
    passwordSalt: password.salt,
    mustChangePassword: true,
    temporaryPasswordExpiresAt,
    failedLoginCount: 0,
    lockedUntil: null,
    credentialIssuedAt: new Date(),
  }).where(eq(agents.id, id));
  return { success: true as const, agentCode: agent.agentCode, temporaryPassword, temporaryPasswordExpiresAt };
}

export async function getAgentByUserId(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
  return rows[0] ?? null;
}

async function requireActiveAgentForUser(userId: number) {
  const agent = await getAgentByUserId(userId);
  if (!agent || agent.status !== "active") throw new Error("AGENT_ACCOUNT_UNAVAILABLE");
  return agent;
}

export async function createPlayerInvitation(agentUserId: number, input: PlayerInviteCreateInput) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const existingProfiles = await db
    .select({ id: playerProfiles.id })
    .from(playerProfiles)
    .where(eq(playerProfiles.playerCode, input.playerCode))
    .limit(1);
  if (existingProfiles[0]) throw new Error("PLAYER_CODE_ALREADY_EXISTS");
  const token = createPlayerInviteToken();
  const password = createPasswordHash(input.password);
  const encryptedBankNumber = encryptBankAccountNumber(input.bankAccountNumber);
  const expiresAt = new Date(Date.now() + playerInviteLifetimeMs);
  const now = new Date();
  try {
    await db.transaction(async tx => {
    const tokenHash = hashPlayerInviteToken(token);
    await tx.insert(playerInvitations).values({
      agentId: agent.id,
      tokenHash,
      status: "issued",
      expiresAt,
    });
    const invitation = await tx.select().from(playerInvitations).where(eq(playerInvitations.tokenHash, tokenHash)).limit(1);
    if (!invitation[0]) throw new Error("PLAYER_INVITATION_CREATE_FAILED");
    await tx.insert(playerProfiles).values({
      agentId: agent.id,
      invitationId: invitation[0].id,
      playerCode: input.playerCode,
      phone: input.phone,
      bankAccountName: input.bankAccountName,
      bankType: input.bankType,
      streamerAccount: input.streamerAccount,
      bankAccountNumberEncrypted: encryptedBankNumber.encrypted,
      bankAccountNumberIv: encryptedBankNumber.iv,
      passwordHash: password.hash,
      passwordSalt: password.salt,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(now.getTime() + playerTemporaryPasswordLifetimeMs),
      failedLoginCount: 0,
      credentialIssuedAt: now,
      status: "invited",
    });
    const profile = await tx.select().from(playerProfiles).where(eq(playerProfiles.invitationId, invitation[0].id)).limit(1);
    if (!profile[0]) throw new Error("PLAYER_PROFILE_CREATE_FAILED");
    await tx.update(playerInvitations).set({ playerProfileId: profile[0].id }).where(eq(playerInvitations.id, invitation[0].id));
    });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new Error("PLAYER_CODE_ALREADY_EXISTS");
    throw error;
  }
  return { success: true as const, token, playerCode: input.playerCode, temporaryPassword: input.password, expiresAt };
}

export async function listPlayerInvitationsForAgent(agentUserId: number) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const rows = await db
    .select({
      id: playerInvitations.id,
      status: playerInvitations.status,
      expiresAt: playerInvitations.expiresAt,
      redeemedAt: playerInvitations.redeemedAt,
      createdAt: playerInvitations.createdAt,
      playerProfileId: playerProfiles.id,
      playerCode: playerProfiles.playerCode,
      phone: playerProfiles.phone,
      bankAccountName: playerProfiles.bankAccountName,
      bankType: playerProfiles.bankType,
      streamerAccount: playerProfiles.streamerAccount,
      playerStatus: playerProfiles.status,
      availableUnits: unitBalances.availableUnits,
    })
    .from(playerInvitations)
    .leftJoin(playerProfiles, eq(playerInvitations.playerProfileId, playerProfiles.id))
    .leftJoin(unitBalances, and(eq(unitBalances.ownerType, "player"), eq(unitBalances.ownerId, playerProfiles.id)))
    .where(eq(playerInvitations.agentId, agent.id))
    .orderBy(desc(playerInvitations.createdAt), desc(playerInvitations.id));
  return rows.map(toAgentVisiblePlayerInvitation);
}

export async function revokePlayerInvitation(agentUserId: number, invitationId: number) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  await db.transaction(async tx => {
    const invitations = await tx
      .select()
      .from(playerInvitations)
      .where(and(
        eq(playerInvitations.id, invitationId),
        eq(playerInvitations.agentId, agent.id),
        eq(playerInvitations.status, "issued"),
      ))
      .limit(1);
    const invitation = invitations[0];
    if (!invitation) return;
    await tx.update(playerInvitations).set({ status: "revoked" }).where(eq(playerInvitations.id, invitation.id));
    if (invitation.playerProfileId) {
      await tx.update(playerProfiles).set({ status: "suspended" }).where(eq(playerProfiles.id, invitation.playerProfileId));
    }
  });
  return { success: true as const };
}

async function getOwnedPlayerForAgent(agentId: number, playerProfileId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(playerProfiles)
    .where(and(eq(playerProfiles.id, playerProfileId), eq(playerProfiles.agentId, agentId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function setOwnedPlayerAccountStatus(agentUserId: number, input: PlayerAccountStatusInput) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const profile = await getOwnedPlayerForAgent(agent.id, input.playerProfileId);
  if (!profile) throw new Error("PLAYER_ACCOUNT_UNAVAILABLE");
  const isSuspend = input.action === "suspend";
  if (isSuspend && profile.status !== "active") throw new Error("PLAYER_STATUS_CHANGE_UNAVAILABLE");
  if (!isSuspend && (profile.status !== "suspended" || !profile.activatedAt)) throw new Error("PLAYER_STATUS_CHANGE_UNAVAILABLE");
  const nextStatus = isSuspend ? "suspended" as const : "active" as const;
  await db.transaction(async tx => {
    await tx.update(playerProfiles).set({ status: nextStatus }).where(eq(playerProfiles.id, profile.id));
    await tx.insert(playerAccountEvents).values({
      playerProfileId: profile.id,
      agentId: agent.id,
      eventType: isSuspend ? "suspended" : "reactivated",
      performedByUserId: agentUserId,
    });
  });
  return { success: true as const, playerProfileId: profile.id, status: nextStatus };
}

export async function resetOwnedPlayerCredentials(agentUserId: number, input: PlayerCredentialResetInput) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const profile = await getOwnedPlayerForAgent(agent.id, input.playerProfileId);
  if (!profile || profile.status === "suspended" || !profile.playerCode) throw new Error("PLAYER_ACCOUNT_UNAVAILABLE");
  const temporaryPassword = createTemporaryPassword();
  const password = createPasswordHash(temporaryPassword);
  const temporaryPasswordExpiresAt = new Date(Date.now() + playerTemporaryPasswordLifetimeMs);
  await db.transaction(async tx => {
    await tx.update(playerProfiles).set({
      passwordHash: password.hash,
      passwordSalt: password.salt,
      mustChangePassword: true,
      temporaryPasswordExpiresAt,
      failedLoginCount: 0,
      lockedUntil: null,
      credentialIssuedAt: new Date(),
    }).where(eq(playerProfiles.id, profile.id));
    await tx.insert(playerAccountEvents).values({
      playerProfileId: profile.id,
      agentId: agent.id,
      eventType: "password_reset",
      performedByUserId: agentUserId,
    });
  });
  return { success: true as const, playerProfileId: profile.id, playerCode: profile.playerCode, temporaryPassword, temporaryPasswordExpiresAt };
}

async function validatePlayerPassword(profile: typeof playerProfiles.$inferSelect, password: string, now: Date) {
  if (!profile.playerCode || !profile.passwordHash || !profile.passwordSalt || profile.status === "suspended") {
    throw new Error("INVALID_PLAYER_CREDENTIALS");
  }
  if (profile.lockedUntil && profile.lockedUntil > now) throw new Error("PLAYER_CREDENTIALS_LOCKED");
  if (profile.mustChangePassword && profile.temporaryPasswordExpiresAt && profile.temporaryPasswordExpiresAt <= now) {
    throw new Error("PLAYER_TEMPORARY_PASSWORD_EXPIRED");
  }
  if (!passwordMatches(password, profile.passwordSalt, profile.passwordHash)) {
    const failedLoginCount = profile.failedLoginCount + 1;
    const db = await requireDb();
    await db.update(playerProfiles).set({
      failedLoginCount,
      lockedUntil: failedLoginCount >= maxFailedLoginAttempts ? new Date(now.getTime() + loginLockoutMs) : null,
    }).where(eq(playerProfiles.id, profile.id));
    throw new Error("INVALID_PLAYER_CREDENTIALS");
  }
}

export async function activatePlayerInvitation(token: string, playerCode: string, password: string) {
  const db = await requireDb();
  const tokenHash = hashPlayerInviteToken(token);
  const now = new Date();
  return db.transaction(async tx => {
    const invitations = await tx.select().from(playerInvitations).where(eq(playerInvitations.tokenHash, tokenHash)).limit(1);
    const invitation = invitations[0];
    if (!invitation || invitation.status !== "issued" || invitation.expiresAt <= now || !invitation.playerProfileId) {
      throw new Error("PLAYER_INVITATION_INVALID");
    }

    const invitedAgent = await tx.select().from(agents).where(eq(agents.id, invitation.agentId)).limit(1);
    if (!invitedAgent[0] || invitedAgent[0].status !== "active") {
      throw new Error("PLAYER_INVITATION_UNAVAILABLE");
    }

    const profiles = await tx.select().from(playerProfiles).where(eq(playerProfiles.id, invitation.playerProfileId)).limit(1);
    const profile = profiles[0];
    if (!profile || profile.status !== "invited" || profile.playerCode !== playerCode) {
      throw new Error("PLAYER_INVITATION_CREDENTIAL_MISMATCH");
    }
    await validatePlayerPassword(profile, password, now);

    await tx
      .update(playerInvitations)
      .set({ status: "redeemed", redeemedByPlayerProfileId: profile.id, redeemedAt: now })
      .where(and(eq(playerInvitations.id, invitation.id), eq(playerInvitations.status, "issued")));

    const consumed = await tx.select().from(playerInvitations).where(eq(playerInvitations.id, invitation.id)).limit(1);
    if (consumed[0]?.status !== "redeemed" || consumed[0]?.redeemedByPlayerProfileId !== profile.id) {
      throw new Error("PLAYER_INVITATION_ALREADY_USED");
    }

    await tx.update(playerProfiles).set({
      status: "active",
      failedLoginCount: 0,
      lockedUntil: null,
      activatedAt: profile.activatedAt ?? now,
      lastCredentialLoginAt: now,
    }).where(eq(playerProfiles.id, profile.id));
    return { playerProfileId: profile.id, mustChangePassword: profile.mustChangePassword };
  });
}

export async function authenticatePlayerCredentials(playerCode: string, password: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(playerProfiles)
    .where(eq(playerProfiles.playerCode, playerCode.trim().toUpperCase()))
    .limit(1);
  const profile = rows[0];
  const now = new Date();
  if (!profile || profile.status !== "active") throw new Error("INVALID_PLAYER_CREDENTIALS");
  await validatePlayerPassword(profile, password, now);
  await db.update(playerProfiles).set({
    failedLoginCount: 0,
    lockedUntil: null,
    lastCredentialLoginAt: now,
  }).where(eq(playerProfiles.id, profile.id));
  return { playerProfileId: profile.id, mustChangePassword: profile.mustChangePassword };
}

export async function changePlayerPassword(playerProfileId: number, newPassword: string) {
  const db = await requireDb();
  const profile = await getPlayerProfileById(playerProfileId);
  if (!profile || profile.status !== "active") throw new Error("PLAYER_ACCOUNT_UNAVAILABLE");
  const password = createPasswordHash(newPassword);
  await db.update(playerProfiles).set({
    passwordHash: password.hash,
    passwordSalt: password.salt,
    mustChangePassword: false,
    temporaryPasswordExpiresAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
  }).where(eq(playerProfiles.id, playerProfileId));
  return { success: true as const };
}

export async function getPlayerProfileById(playerProfileId: number) {
  const db = await requireDb();
  const rows = await db.select().from(playerProfiles).where(eq(playerProfiles.id, playerProfileId)).limit(1);
  return rows[0] ?? null;
}

/** Read-only, Player-facing view of the internal Unit ledger. */
export async function getPlayerUnitOverview(playerProfileId: number) {
  const db = await requireDb();
  const profile = await getPlayerProfileById(playerProfileId);
  if (!profile || profile.status !== "active") throw new Error("PLAYER_ACCOUNT_UNAVAILABLE");

  const availableUnits = await readUnitBalance(db, "player", playerProfileId);
  const transactions = await db
    .select({
      id: unitTransactions.id,
      transactionType: unitTransactions.transactionType,
      amount: unitTransactions.amount,
      fromOwnerType: unitTransactions.fromOwnerType,
      toOwnerType: unitTransactions.toOwnerType,
      note: unitTransactions.note,
      createdAt: unitTransactions.createdAt,
    })
    .from(unitTransactions)
    .where(or(
      and(eq(unitTransactions.fromOwnerType, "player"), eq(unitTransactions.fromOwnerId, playerProfileId)),
      and(eq(unitTransactions.toOwnerType, "player"), eq(unitTransactions.toOwnerId, playerProfileId)),
    ))
    .orderBy(desc(unitTransactions.createdAt), desc(unitTransactions.id))
    .limit(20);

  return { availableUnits, transactions };
}

type UnitOwnerType = "agent" | "player";

async function readUnitBalance(db: Awaited<ReturnType<typeof getDb>>, ownerType: UnitOwnerType, ownerId: number) {
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const rows = await db
    .select({ availableUnits: unitBalances.availableUnits })
    .from(unitBalances)
    .where(and(eq(unitBalances.ownerType, ownerType), eq(unitBalances.ownerId, ownerId)))
    .limit(1);
  return rows[0]?.availableUnits ?? 0;
}

export async function listAdminAgentUnitBalances() {
  const db = await requireDb();
  return db
    .select({
      id: agents.id,
      fullName: agents.fullName,
      agentCode: agents.agentCode,
      status: agents.status,
      availableUnits: unitBalances.availableUnits,
      updatedAt: unitBalances.updatedAt,
    })
    .from(agents)
    .leftJoin(unitBalances, and(eq(unitBalances.ownerType, "agent"), eq(unitBalances.ownerId, agents.id)))
    .orderBy(desc(agents.updatedAt), desc(agents.id));
}

export async function listAdminUnitTransactions() {
  const db = await requireDb();
  return db.select().from(unitTransactions).orderBy(desc(unitTransactions.createdAt), desc(unitTransactions.id)).limit(50);
}

export async function issueUnitsToAgent(adminUserId: number, input: AdminUnitIssueInput) {
  const db = await requireDb();
  const agentRows = await db.select().from(agents).where(eq(agents.id, input.agentId)).limit(1);
  const agent = agentRows[0];
  if (!agent || agent.status !== "active") throw new Error("AGENT_ACCOUNT_UNAVAILABLE");

  return db.transaction(async tx => {
    await tx
      .insert(unitBalances)
      .values({ ownerType: "agent", ownerId: agent.id, availableUnits: input.amount })
      .onDuplicateKeyUpdate({ set: { availableUnits: sql`${unitBalances.availableUnits} + ${input.amount}` } });
    await tx.insert(unitTransactions).values({
      transactionType: "admin_issue",
      amount: input.amount,
      fromOwnerType: "system",
      fromOwnerId: null,
      toOwnerType: "agent",
      toOwnerId: agent.id,
      performedByUserId: adminUserId,
      note: input.note ?? null,
    });
    const balanceRows = await tx
      .select({ availableUnits: unitBalances.availableUnits })
      .from(unitBalances)
      .where(and(eq(unitBalances.ownerType, "agent"), eq(unitBalances.ownerId, agent.id)))
      .limit(1);
    const availableUnits = balanceRows[0]?.availableUnits ?? 0;
    return { success: true as const, agentId: agent.id, availableUnits };
  });
}

export async function getAgentUnitOverview(agentUserId: number) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const availableUnits = await readUnitBalance(db, "agent", agent.id);
  const players = await db
    .select({
      id: playerProfiles.id,
      playerCode: playerProfiles.playerCode,
      phone: playerProfiles.phone,
      status: playerProfiles.status,
      availableUnits: unitBalances.availableUnits,
    })
    .from(playerProfiles)
    .leftJoin(unitBalances, and(eq(unitBalances.ownerType, "player"), eq(unitBalances.ownerId, playerProfiles.id)))
    .where(eq(playerProfiles.agentId, agent.id))
    .orderBy(desc(playerProfiles.createdAt), desc(playerProfiles.id));
  const transactions = await db
    .select()
    .from(unitTransactions)
    .where(or(
      and(eq(unitTransactions.fromOwnerType, "agent"), eq(unitTransactions.fromOwnerId, agent.id)),
      and(eq(unitTransactions.toOwnerType, "agent"), eq(unitTransactions.toOwnerId, agent.id)),
    ))
    .orderBy(desc(unitTransactions.createdAt), desc(unitTransactions.id))
    .limit(30);
  return { agentId: agent.id, availableUnits, players, transactions };
}

export async function transferAgentUnitsToPlayer(agentUserId: number, input: AgentPlayerUnitTransferInput) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const players = await db
    .select()
    .from(playerProfiles)
    .where(and(
      eq(playerProfiles.id, input.playerProfileId),
      eq(playerProfiles.agentId, agent.id),
      eq(playerProfiles.status, "active"),
    ))
    .limit(1);
  const player = players[0];
  if (!player) throw new Error("PLAYER_ACCOUNT_UNAVAILABLE");

  return db.transaction(async tx => {
    await tx
      .insert(unitBalances)
      .values({ ownerType: "agent", ownerId: agent.id, availableUnits: 0 })
      .onDuplicateKeyUpdate({ set: { ownerId: sql`${unitBalances.ownerId}` } });
    const result = await tx.execute(sql`
      UPDATE ${unitBalances}
      SET ${unitBalances.availableUnits} = ${unitBalances.availableUnits} - ${input.amount}
      WHERE ${unitBalances.ownerType} = 'agent'
        AND ${unitBalances.ownerId} = ${agent.id}
        AND ${unitBalances.availableUnits} >= ${input.amount}
    `);
    const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error("AGENT_UNIT_BALANCE_INSUFFICIENT");
    await tx
      .insert(unitBalances)
      .values({ ownerType: "player", ownerId: player.id, availableUnits: input.amount })
      .onDuplicateKeyUpdate({ set: { availableUnits: sql`${unitBalances.availableUnits} + ${input.amount}` } });
    await tx.insert(unitTransactions).values({
      transactionType: "agent_transfer",
      amount: input.amount,
      fromOwnerType: "agent",
      fromOwnerId: agent.id,
      toOwnerType: "player",
      toOwnerId: player.id,
      performedByUserId: agentUserId,
      note: input.note ?? null,
    });
    const agentBalanceRows = await tx
      .select({ availableUnits: unitBalances.availableUnits })
      .from(unitBalances)
      .where(and(eq(unitBalances.ownerType, "agent"), eq(unitBalances.ownerId, agent.id)))
      .limit(1);
    const playerBalanceRows = await tx
      .select({ availableUnits: unitBalances.availableUnits })
      .from(unitBalances)
      .where(and(eq(unitBalances.ownerType, "player"), eq(unitBalances.ownerId, player.id)))
      .limit(1);
    const agentAvailableUnits = agentBalanceRows[0]?.availableUnits ?? 0;
    const playerAvailableUnits = playerBalanceRows[0]?.availableUnits ?? 0;
    return { success: true as const, playerProfileId: player.id, agentAvailableUnits, playerAvailableUnits };
  });
}

export async function adjustOwnedPlayerUnits(agentUserId: number, input: AgentPlayerUnitAdjustmentInput) {
  const db = await requireDb();
  const agent = await requireActiveAgentForUser(agentUserId);
  const player = await getOwnedPlayerForAgent(agent.id, input.playerProfileId);
  if (!player || player.status !== "active") throw new Error("PLAYER_ACCOUNT_UNAVAILABLE");

  return db.transaction(async tx => {
    await tx.insert(unitBalances).values({ ownerType: "agent", ownerId: agent.id, availableUnits: 0 }).onDuplicateKeyUpdate({ set: { ownerId: sql`${unitBalances.ownerId}` } });
    await tx.insert(unitBalances).values({ ownerType: "player", ownerId: player.id, availableUnits: 0 }).onDuplicateKeyUpdate({ set: { ownerId: sql`${unitBalances.ownerId}` } });
    if (input.direction === "credit") {
      const result = await tx.execute(sql`
        UPDATE ${unitBalances} SET ${unitBalances.availableUnits} = ${unitBalances.availableUnits} - ${input.amount}
        WHERE ${unitBalances.ownerType} = 'agent' AND ${unitBalances.ownerId} = ${agent.id}
          AND ${unitBalances.availableUnits} >= ${input.amount}
      `);
      const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
      if (affectedRows !== 1) throw new Error("AGENT_UNIT_BALANCE_INSUFFICIENT");
      await tx.update(unitBalances).set({ availableUnits: sql`${unitBalances.availableUnits} + ${input.amount}` }).where(and(eq(unitBalances.ownerType, "player"), eq(unitBalances.ownerId, player.id)));
      await tx.insert(unitTransactions).values({ transactionType: "agent_adjustment_credit", amount: input.amount, fromOwnerType: "agent", fromOwnerId: agent.id, toOwnerType: "player", toOwnerId: player.id, performedByUserId: agentUserId, note: input.note });
    } else {
      const result = await tx.execute(sql`
        UPDATE ${unitBalances} SET ${unitBalances.availableUnits} = ${unitBalances.availableUnits} - ${input.amount}
        WHERE ${unitBalances.ownerType} = 'player' AND ${unitBalances.ownerId} = ${player.id}
          AND ${unitBalances.availableUnits} >= ${input.amount}
      `);
      const affectedRows = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
      if (affectedRows !== 1) throw new Error("PLAYER_UNIT_BALANCE_INSUFFICIENT");
      await tx.update(unitBalances).set({ availableUnits: sql`${unitBalances.availableUnits} + ${input.amount}` }).where(and(eq(unitBalances.ownerType, "agent"), eq(unitBalances.ownerId, agent.id)));
      await tx.insert(unitTransactions).values({ transactionType: "agent_adjustment_debit", amount: input.amount, fromOwnerType: "player", fromOwnerId: player.id, toOwnerType: "agent", toOwnerId: agent.id, performedByUserId: agentUserId, note: input.note });
    }
    const agentBalanceRows = await tx.select({ availableUnits: unitBalances.availableUnits }).from(unitBalances).where(and(eq(unitBalances.ownerType, "agent"), eq(unitBalances.ownerId, agent.id))).limit(1);
    const playerBalanceRows = await tx.select({ availableUnits: unitBalances.availableUnits }).from(unitBalances).where(and(eq(unitBalances.ownerType, "player"), eq(unitBalances.ownerId, player.id))).limit(1);
    return { success: true as const, direction: input.direction, playerProfileId: player.id, agentAvailableUnits: agentBalanceRows[0]?.availableUnits ?? 0, playerAvailableUnits: playerBalanceRows[0]?.availableUnits ?? 0 };
  });
}
