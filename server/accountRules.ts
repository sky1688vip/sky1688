type ActivatableAgent = {
  email: string;
  status: "invited" | "active" | "suspended";
  activationExpiresAt: Date;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function assertAgentActivationAllowed(agent: ActivatableAgent | undefined, currentEmail: string | null, now = new Date()) {
  if (!currentEmail) throw new Error("A Manus account email is required to activate an agent account.");
  if (!agent || agent.status !== "invited" || agent.activationExpiresAt.getTime() < now.getTime()) {
    throw new Error("This agent activation code is invalid, expired, or unavailable.");
  }
  if (normalizeEmail(agent.email) !== normalizeEmail(currentEmail)) {
    throw new Error("This activation code belongs to a different email address.");
  }
}
