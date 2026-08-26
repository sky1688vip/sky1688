import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "agent", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const dreamCategories = mysqlTable(
  "dream_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    sortOrder: int("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("dream_categories_slug_unique").on(table.slug)],
);

export const lotteryResults = mysqlTable(
  "lottery_results",
  {
    id: int("id").autoincrement().primaryKey(),
    gameType: mysqlEnum("gameType", ["2d", "3d"]).notNull(),
    resultNumber: varchar("resultNumber", { length: 8 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    note: text("note"),
    sourceLabel: varchar("sourceLabel", { length: 160 }),
    drawAt: timestamp("drawAt").notNull(),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("draft")
      .notNull(),
    publishedAt: timestamp("publishedAt"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("lottery_results_visibility_draw_index").on(table.status, table.drawAt),
    index("lottery_results_type_draw_index").on(table.gameType, table.drawAt),
  ],
);

export const dreamEntries = mysqlTable(
  "dream_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId"),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary").notNull(),
    meaning: text("meaning").notNull(),
    luckyNumbers: varchar("luckyNumbers", { length: 120 }).notNull(),
    imageUrl: varchar("imageUrl", { length: 1024 }),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("draft")
      .notNull(),
    publishedAt: timestamp("publishedAt"),
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("dream_entries_slug_unique").on(table.slug),
    index("dream_entries_visibility_category_index").on(table.status, table.categoryId),
  ],
);

/**
 * Agent accounts can only be provisioned by an administrator. Their login ID
 * and temporary password are issued by that administrator, independently of
 * Manus OAuth identity.
 */
export const agents = mysqlTable(
  "agents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    agentCode: varchar("agentCode", { length: 32 }).notNull(),
    status: mysqlEnum("status", ["invited", "active", "suspended"])
      .default("invited")
      .notNull(),
    activationCodeHash: varchar("activationCodeHash", { length: 64 }),
    activationExpiresAt: timestamp("activationExpiresAt"),
    passwordHash: varchar("passwordHash", { length: 255 }),
    passwordSalt: varchar("passwordSalt", { length: 64 }),
    mustChangePassword: boolean("mustChangePassword").default(true).notNull(),
    temporaryPasswordExpiresAt: timestamp("temporaryPasswordExpiresAt"),
    failedLoginCount: int("failedLoginCount").default(0).notNull(),
    lockedUntil: timestamp("lockedUntil"),
    credentialIssuedAt: timestamp("credentialIssuedAt"),
    lastCredentialLoginAt: timestamp("lastCredentialLoginAt"),
    activatedAt: timestamp("activatedAt"),
    suspendedAt: timestamp("suspendedAt"),
    createdByUserId: int("createdByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("agents_user_id_unique").on(table.userId),
    uniqueIndex("agents_email_unique").on(table.email),
    uniqueIndex("agents_code_unique").on(table.agentCode),
    uniqueIndex("agents_activation_hash_unique").on(table.activationCodeHash),
    index("agents_status_created_index").on(table.status, table.createdAt),
  ],
);

/**
 * Player profiles are created only when an Agent-issued Player invitation is
 * redeemed by an authenticated plain-user account. This table intentionally
 * stores no wallet, payment, or wagering data.
 */
export const playerProfiles = mysqlTable(
  "player_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    agentId: int("agentId"),
    displayName: varchar("displayName", { length: 160 }),
    status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("player_profiles_user_id_unique").on(table.userId),
    index("player_profiles_status_created_index").on(table.status, table.createdAt),
    index("player_profiles_agent_created_index").on(table.agentId, table.createdAt),
  ],
);

/**
 * Only active Agents can create Player invitations. The raw secret is returned
 * once to the issuing Agent; the database stores a SHA-256 hash instead.
 */
export const playerInvitations = mysqlTable(
  "player_invitations",
  {
    id: int("id").autoincrement().primaryKey(),
    agentId: int("agentId").notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["issued", "redeemed", "revoked"]).default("issued").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    redeemedByUserId: int("redeemedByUserId"),
    redeemedAt: timestamp("redeemedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("player_invitations_token_hash_unique").on(table.tokenHash),
    index("player_invitations_agent_status_created_index").on(table.agentId, table.status, table.createdAt),
    index("player_invitations_status_expires_index").on(table.status, table.expiresAt),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type DreamCategory = typeof dreamCategories.$inferSelect;
export type LotteryResult = typeof lotteryResults.$inferSelect;
export type DreamEntry = typeof dreamEntries.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type PlayerInvitation = typeof playerInvitations.$inferSelect;
