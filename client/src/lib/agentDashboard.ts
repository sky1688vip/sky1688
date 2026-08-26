export type AgentPlayerInvitationMetric = {
  status: "issued" | "redeemed" | "revoked";
  createdAt: Date | string;
};

export function calculatePlayerAccountMetrics(
  invitations: AgentPlayerInvitationMetric[] | undefined,
  now = new Date(),
) {
  const items = invitations ?? [];
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return {
    total: items.length,
    issued: items.filter(item => item.status === "issued").length,
    activated: items.filter(item => item.status === "redeemed").length,
    today: items.filter(item => new Date(item.createdAt).getTime() >= todayStart).length,
  };
}
