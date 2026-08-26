import { z } from "zod";

export const gameTypeSchema = z.enum(["2d", "3d"]);
export const publicationStatusSchema = z.enum(["draft", "published", "archived"]);

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Slug 只能包含小写字母、数字和连字符");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform(value => value || undefined);

export const publicResultsListSchema = z.object({
  gameType: gameTypeSchema.optional(),
  limit: z.number().int().min(1).max(50).default(12),
});

export const publicResultDetailSchema = z.object({
  id: z.number().int().positive(),
});

export const publicDreamListSchema = z.object({
  search: optionalText(80),
  categorySlug: optionalText(80),
  limit: z.number().int().min(1).max(60).default(24),
});

export const publicDreamDetailSchema = z.object({
  slug: slugSchema,
});

export const resultCreateSchema = z.object({
  gameType: gameTypeSchema,
  resultNumber: z.string().trim().min(1).max(8),
  title: z.string().trim().min(2).max(180),
  note: optionalText(4000),
  sourceLabel: optionalText(160),
  drawAt: z.coerce.date(),
  status: publicationStatusSchema.default("draft"),
});

export const resultUpdateSchema = resultCreateSchema.extend({
  id: z.number().int().positive(),
});

export const resultStatusSchema = z.object({
  id: z.number().int().positive(),
  status: publicationStatusSchema,
});

export const dreamCreateSchema = z.object({
  categoryId: z.number().int().positive().nullable().optional(),
  slug: slugSchema,
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().min(6).max(2000),
  meaning: z.string().trim().min(6).max(10000),
  luckyNumbers: z.string().trim().min(1).max(120),
  imageUrl: z.union([z.string().url().max(1024), z.literal("")]).optional(),
  status: publicationStatusSchema.default("draft"),
});

export const dreamUpdateSchema = dreamCreateSchema.extend({
  id: z.number().int().positive(),
});

export const dreamStatusSchema = z.object({
  id: z.number().int().positive(),
  status: publicationStatusSchema,
});

export const categoryCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "分类标识只能包含小写字母、数字和连字符"),
  name: z.string().trim().min(2).max(120),
  description: optionalText(1000),
});

export type ResultCreateInput = z.infer<typeof resultCreateSchema>;
export type ResultUpdateInput = z.infer<typeof resultUpdateSchema>;
export type DreamCreateInput = z.infer<typeof dreamCreateSchema>;
export type DreamUpdateInput = z.infer<typeof dreamUpdateSchema>;
