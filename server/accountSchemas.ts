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
  email: z.string().trim().email().max(320).transform(value => value.toLowerCase()),
  phone: optionalText(40),
});

export const agentActivationSchema = z.object({
  activationCode: z
    .string()
    .trim()
    .min(8)
    .max(40)
    .transform(value => value.toUpperCase()),
});

export const agentSuspendSchema = z.object({
  id: z.number().int().positive(),
});

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;
