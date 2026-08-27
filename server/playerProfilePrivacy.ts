export type AgentPlayerInvitationListSource = {
  id: number;
  status: "issued" | "redeemed" | "revoked";
  expiresAt: Date;
  redeemedAt: Date | null;
  createdAt: Date;
  playerProfileId: number | null;
  playerCode: string | null;
  phone: string | null;
  bankAccountName: string | null;
  bankType: string | null;
  streamerAccount: string | null;
  playerStatus: "invited" | "active" | "suspended" | null;
  availableUnits: number | null;
  bankAccountNumberEncrypted?: unknown;
  bankAccountNumberIv?: unknown;
};

export function toAgentVisiblePlayerInvitation(source: AgentPlayerInvitationListSource) {
  return {
    id: source.id,
    status: source.status,
    expiresAt: source.expiresAt,
    redeemedAt: source.redeemedAt,
    createdAt: source.createdAt,
    playerProfileId: source.playerProfileId,
    playerCode: source.playerCode,
    phone: source.phone,
    bankAccountName: source.bankAccountName,
    bankType: source.bankType,
    streamerAccount: source.streamerAccount,
    playerStatus: source.playerStatus,
    availableUnits: source.availableUnits ?? 0,
  };
}

type PlayerSessionProfileSource = {
  id: number;
  displayName: string | null;
  playerCode: string | null;
  status: "invited" | "active" | "suspended";
  mustChangePassword: boolean;
  activatedAt: Date | null;
};

/**
 * Player credential sessions never need password hashes, lockout metadata, or
 * encrypted bank fields. Keep the session response deliberately minimal.
 */
export function toPlayerSessionProfile(source: PlayerSessionProfileSource) {
  return {
    id: source.id,
    displayName: source.displayName,
    playerCode: source.playerCode,
    status: source.status,
    mustChangePassword: source.mustChangePassword,
    activatedAt: source.activatedAt,
  };
}
