import { describe, expect, it } from "vitest";
import { calculatePlayerAccountMetrics } from "./agentDashboard";

describe("calculatePlayerAccountMetrics", () => {
  it("counts Agent-issued Player account states and today's real-date boundary", () => {
    const metrics = calculatePlayerAccountMetrics([
      { status: "issued", createdAt: new Date("2026-08-26T01:00:00.000Z") },
      { status: "redeemed", createdAt: new Date("2026-08-26T02:00:00.000Z") },
      { status: "revoked", createdAt: new Date("2026-08-25T23:59:59.000Z") },
    ], new Date("2026-08-26T12:00:00.000Z"));

    expect(metrics).toEqual({ total: 3, issued: 1, activated: 1, today: 2 });
  });

  it("returns zero-only metrics when an Agent has not issued any Player account", () => {
    expect(calculatePlayerAccountMetrics(undefined, new Date("2026-08-26T12:00:00.000Z"))).toEqual({ total: 0, issued: 0, activated: 0, today: 0 });
  });
});
