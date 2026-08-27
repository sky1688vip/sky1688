import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform(value => value || undefined);

export const agentCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320).optional().transform(value => value?.toLowerCase()),
  phone: optionalText(40),
});

export const agentCredentialLoginSchema = z.object({
  agentCode: z
    .string()
    .trim()
    .min(6)
    .max(40)
    .transform(value => value.toUpperCase()),
  password: z.string().min(12).max(128),
});

export const agentPasswordChangeSchema = z.object({
  newPassword: z
    .string()
    .min(12, "Password must have at least 12 characters.")
    .max(128),
});

export const agentSuspendSchema = z.object({
  id: z.number().int().positive(),
});

export const agentCredentialResetSchema = z.object({
  id: z.number().int().positive(),
});

export const playerInviteActivateSchema = z.object({
  token: z.string().trim().min(32).max(128),
  playerCode: z.string().trim().min(6).max(40).transform(value => value.toUpperCase()),
  password: z.string().min(12).max(128),
});

export const playerInviteCreateSchema = z.object({
  playerCode: z
    .string()
    .trim()
    .min(6, "Player ID must have at least 6 characters.")
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "Player ID must not contain spaces or symbols.")
    .transform(value => value.toUpperCase()),
  password: z.string().min(12, "Password must have at least 12 characters.").max(128),
  phone: z.string().trim().min(6).max(40),
  bankAccountName: z.string().trim().min(2).max(160),
  bankType: z.string().trim().min(2).max(120),
  streamerAccount: z.string().trim().min(2).max(120),
  bankAccountNumber: z
    .string()
    .trim()
    .min(4)
    .max(80)
    .regex(/^[A-Za-z0-9 -]+$/, "Bank account number contains unsupported characters.")
    .transform(value => value.replace(/\s+/g, "")),
});

export const playerCredentialLoginSchema = z.object({
  playerCode: z.string().trim().min(6).max(40).transform(value => value.toUpperCase()),
  password: z.string().min(12).max(128),
});

export const playerPasswordChangeSchema = z.object({
  newPassword: z.string().min(12, "Password must have at least 12 characters.").max(128),
});

export const playerInviteRevokeSchema = z.object({
  id: z.number().int().positive(),
});

const unitAmountSchema = z.number().int().positive().max(1_000_000, "A single Unit transaction cannot exceed 1,000,000 Units.");
const unitNoteSchema = optionalText(240);

export const adminUnitIssueSchema = z.object({
  agentId: z.number().int().positive(),
  amount: unitAmountSchema,
  note: unitNoteSchema,
});

export const agentPlayerUnitTransferSchema = z.object({
  playerProfileId: z.number().int().positive(),
  amount: unitAmountSchema,
  note: unitNoteSchema,
});

export const playerAccountStatusSchema = z.object({
  playerProfileId: z.number().int().positive(),
  action: z.enum(["suspend", "reactivate"]),
});

export const playerCredentialResetSchema = z.object({
  playerProfileId: z.number().int().positive(),
});

export const agentPlayerUnitAdjustmentSchema = z.object({
  playerProfileId: z.number().int().positive(),
  direction: z.enum(["credit", "debit"]),
  amount: unitAmountSchema,
  note: z.string().trim().min(3, "A reason is required for Unit adjustments.").max(240),
});

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;
export type PlayerInviteCreateInput = z.infer<typeof playerInviteCreateSchema>;
export type AdminUnitIssueInput = z.infer<typeof adminUnitIssueSchema>;
export type AgentPlayerUnitTransferInput = z.infer<typeof agentPlayerUnitTransferSchema>;
export type PlayerAccountStatusInput = z.infer<typeof playerAccountStatusSchema>;
export type PlayerCredentialResetInput = z.infer<typeof playerCredentialResetSchema>;
export type AgentPlayerUnitAdjustmentInput = z.infer<typeof agentPlayerUnitAdjustmentSchema>;
