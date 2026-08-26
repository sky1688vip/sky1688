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

export const playerInviteRedeemSchema = z.object({
  token: z.string().trim().min(32).max(128),
});

export const playerInviteRevokeSchema = z.object({
  id: z.number().int().positive(),
});

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;
