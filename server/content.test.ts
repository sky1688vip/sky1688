import { beforeEach, describe, expect, it, vi } from "vitest";
import { dreamCreateSchema, resultCreateSchema } from "./contentSchemas";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  listPublishedResults: vi.fn(),
  getPublishedResult: vi.fn(),
  listPublicCategories: vi.fn(),
  listPublishedDreams: vi.fn(),
  getPublishedDream: vi.fn(),
  getAdminOverview: vi.fn(),
  createLotteryResult: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const userFactory = (role: "user" | "admin") => ({
  id: role === "admin" ? 1 : 7,
  openId: `${role}-user`,
  email: `${role}@example.com`,
  name: role === "admin" ? "Content Admin" : "Regular User",
  loginMethod: "manus",
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

const contextFactory = (role: "user" | "admin" | null): TrpcContext => ({
  user: role ? userFactory(role) : null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("SKY1688 content validation", () => {
  it("requires the essential fields for a lottery result", () => {
    expect(() => resultCreateSchema.parse({ gameType: "2d" })).toThrow();
  });

  it("accepts a publishable Dream1000 entry payload", () => {
    const payload = dreamCreateSchema.parse({
      slug: "moon-over-river",
      title: "梦见月光照在河面",
      summary: "平静的水面映出明亮月光。",
      meaning: "可作为 Dream1000 条目的完整释义内容。",
      luckyNumbers: "01, 10",
      status: "draft",
    });
    expect(payload.slug).toBe("moon-over-river");
  });
});

describe("SKY1688 public content API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.listPublishedResults.mockResolvedValue([{ id: 4, resultNumber: "123", gameType: "3d" }]);
    dbMocks.getPublishedResult.mockResolvedValue({ id: 4, resultNumber: "123", gameType: "3d" });
    dbMocks.listPublicCategories.mockResolvedValue([{ id: 1, slug: "nature", name: "自然" }]);
    dbMocks.listPublishedDreams.mockResolvedValue([{ id: 8, slug: "moon-over-river", title: "梦见月光" }]);
    dbMocks.getPublishedDream.mockResolvedValue({ id: 8, slug: "moon-over-river", title: "梦见月光" });
  });

  it("returns published result data without requiring a user session", async () => {
    const caller = appRouter.createCaller(contextFactory(null));
    await expect(caller.content.results.list({ gameType: "3d", limit: 5 })).resolves.toEqual([{ id: 4, resultNumber: "123", gameType: "3d" }]);
    expect(dbMocks.listPublishedResults).toHaveBeenCalledWith({ gameType: "3d", limit: 5 });
    await expect(caller.content.results.detail({ id: 4 })).resolves.toMatchObject({ resultNumber: "123" });
  });

  it("returns category, search and detail data for Dream1000", async () => {
    const caller = appRouter.createCaller(contextFactory(null));
    await expect(caller.content.dreams.categories()).resolves.toHaveLength(1);
    await expect(caller.content.dreams.list({ search: "月光", categorySlug: "nature", limit: 8 })).resolves.toHaveLength(1);
    await expect(caller.content.dreams.detail({ slug: "moon-over-river" })).resolves.toMatchObject({ slug: "moon-over-river" });
    expect(dbMocks.listPublishedDreams).toHaveBeenCalledWith({ search: "月光", categorySlug: "nature", limit: 8 });
  });
});

describe("SKY1688 administrator guard", () => {
  it("rejects content administration requests from a non-admin user", async () => {
    const caller = appRouter.createCaller(contextFactory("user"));
    await expect(caller.adminContent.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to read the overview and create a result", async () => {
    dbMocks.getAdminOverview.mockResolvedValue({ results: 3, dreams: 7, categories: 2 });
    dbMocks.createLotteryResult.mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(contextFactory("admin"));
    await expect(caller.adminContent.overview()).resolves.toEqual({ results: 3, dreams: 7, categories: 2 });
    await expect(caller.adminContent.results.create({
      gameType: "2d",
      resultNumber: "45",
      title: "测试结果",
      drawAt: new Date("2026-08-25T00:00:00.000Z"),
      status: "draft",
    })).resolves.toEqual({ success: true });
    expect(dbMocks.createLotteryResult).toHaveBeenCalledWith(expect.objectContaining({ resultNumber: "45" }), 1);
  });
});
