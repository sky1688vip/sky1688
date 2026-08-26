import { describe, expect, it } from "vitest";
import { toAgentVisiblePlayerInvitation } from "./playerProfilePrivacy";

describe("toAgentVisiblePlayerInvitation", () => {
  it("returns allowed Player profile fields but excludes encrypted bank account number material", () => {
    const result = toAgentVisiblePlayerInvitation({
      id: 1,
      status: "issued",
      expiresAt: new Date("2026-08-27T00:00:00.000Z"),
      redeemedAt: null,
      createdAt: new Date("2026-08-26T00:00:00.000Z"),
      playerCode: "PLAYER001",
      phone: "0912345678",
      bankAccountName: "Player Name",
      bankType: "KBZ Bank",
      streamerAccount: "မရှိပါ",
      bankAccountNumberEncrypted: "encrypted-value",
      bankAccountNumberIv: "initialization-vector",
    });

    expect(result).toMatchObject({ playerCode: "PLAYER001", phone: "0912345678", bankType: "KBZ Bank" });
    expect(result).not.toHaveProperty("bankAccountNumberEncrypted");
    expect(result).not.toHaveProperty("bankAccountNumberIv");
  });
});
