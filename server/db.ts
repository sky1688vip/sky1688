import { and, count, desc, eq, like, or } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agents,
  dreamCategories,
  dreamEntries,
  InsertUser,
  lotteryResults,
  playerProfiles,
  users,
} from "../drizzle/schema";
import type {
  DreamCreateInput,
  DreamUpdateInput,
  ResultCreateInput,
  ResultUpdateInput,
} from "./contentSchemas";
import type { AgentCreateInput } from "./accountSchemas";
import { assertAgentActivationAllowed } from "./accountRules";
import { ENV } from "./_core/env";

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

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashActivationCode = (value: string) => createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
const randomCode = (prefix: string, bytes: number) => `${prefix}-${randomBytes(bytes).toString("hex").toUpperCase()}`;

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
  const activationCode = randomCode("SKY", 5);
  const activationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const agentCode = randomCode("AG", 4);
  await db.insert(agents).values({
    fullName: input.fullName,
    email: normalizeEmail(input.email),
    phone: input.phone ?? null,
    agentCode,
    status: "invited",
    activationCodeHash: hashActivationCode(activationCode),
    activationExpiresAt,
    createdByUserId,
  });
  return { success: true as const, agentCode, activationCode, activationExpiresAt };
}

export async function suspendAgent(id: number) {
  const db = await requireDb();
  await db.update(agents).set({ status: "suspended", suspendedAt: new Date() }).where(eq(agents.id, id));
  return { success: true as const };
}

export async function activateProvisionedAgent(
  activationCode: string,
  user: { id: number; email: string | null },
) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.activationCodeHash, hashActivationCode(activationCode)))
    .limit(1);
  const agent = rows[0];
  assertAgentActivationAllowed(agent, user.email);
  await db.transaction(async tx => {
    await tx
      .update(agents)
      .set({ userId: user.id, status: "active", activatedAt: new Date(), suspendedAt: null })
      .where(eq(agents.id, agent.id));
    await tx.update(users).set({ role: "agent" }).where(eq(users.id, user.id));
  });
  return { success: true as const, agentCode: agent.agentCode, status: "active" as const };
}

export async function getAgentByUserId(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getOrCreatePlayerProfile(userId: number, displayName?: string) {
  const db = await requireDb();
  const existing = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(playerProfiles).values({ userId, displayName: displayName ?? null, status: "active" });
  const created = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  return created[0] ?? null;
}

export async function getPlayerProfile(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}
