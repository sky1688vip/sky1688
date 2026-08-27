import { describe, expect, it } from "vitest";
import { toAgentVisiblePlayerInvitation, toPlayerSessionProfile } from "./playerProfilePrivacy";

describe("toAgentVisiblePlayerInvitation", () => {
  it("returns allowed Player profile fields but excludes encrypted bank account number material", () => {
    const result = toAgentVisiblePlayerInvitation({
      id: 1,
      status: "issued",
      expiresAt: new Date("2026-08-27T00:00:00.000Z"),
      redeemedAt: null,
      createdAt: new Date("2026-08-26T00:00:00.000Z"),
      playerProfileId: 7,
      playerCode: "PLAYER001",
      phone: "0912345678",
      bankAccountName: "Player Name",
      bankType: "KBZ Bank",
      streamerAccount: "မရှိပါ",
      playerStatus: "active",
      availableUnits: 1200,
      bankAccountNumberEncrypted: "encrypted-value",
      bankAccountNumberIv: "initialization-vector",
    });

    expect(result).toMatchObject({ playerProfileId: 7, playerCode: "PLAYER001", phone: "0912345678", bankType: "KBZ Bank", playerStatus: "active", availableUnits: 1200 });
    expect(result).not.toHaveProperty("bankAccountNumberEncrypted");
    expect(result).not.toHaveProperty("bankAccountNumberIv");
  });
});

describe("toPlayerSessionProfile", () => {
  it("returns only the Player-facing identity and status fields", () => {
    const source = {
      id: 7,
      displayName: "Player Name",
      playerCode: "PLAYER001",
      status: "active" as const,
      mustChangePassword: false,
      activatedAt: new Date("2026-08-26T00:00:00.000Z"),
      passwordHash: "never-return-this",
      passwordSalt: "never-return-this",
      bankAccountNumberEncrypted: "never-return-this",
      bankAccountNumberIv: "never-return-this",
      failedLoginCount: 0,
      lockedUntil: null,
    };
    const result = toPlayerSessionProfile(source);

    expect(result).toMatchObject({ id: 7, playerCode: "PLAYER001", status: "active", mustChangePassword: false });
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("passwordSalt");
    expect(result).not.toHaveProperty("bankAccountNumberEncrypted");
    expect(result).not.toHaveProperty("bankAccountNumberIv");
    expect(result).not.toHaveProperty("failedLoginCount");
    expect(result).not.toHaveProperty("lockedUntil");
  });
});
