export type AgentPlayerInvitationListSource = {
  id: number;
  status: "issued" | "redeemed" | "revoked";
  expiresAt: Date;
  redeemedAt: Date | null;
  createdAt: Date;
  playerCode: string | null;
  phone: string | null;
  bankAccountName: string | null;
  bankType: string | null;
  streamerAccount: string | null;
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
    playerCode: source.playerCode,
    phone: source.phone,
    bankAccountName: source.bankAccountName,
    bankType: source.bankType,
    streamerAccount: source.streamerAccount,
  };
}
