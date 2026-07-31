import { z } from 'zod';

export const RECENTS_MAX = 10;

// Hex color regex: #RRGGBB
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// MM-DD format validation
export const MonthDaySchema = z
  .string()
  .regex(/^\d{2}-\d{2}$/, 'Must be MM-DD format')
  .refine((key) => {
    const [m, d] = key.split('-').map(Number);
    return m >= 1 && m <= 12 && d >= 1 && d <= 31;
  }, 'Invalid month or day');

// Localized stone data
const LocalizedStoneSchema = z.object({
  name: z.string().min(1),
  meaning: z.string().min(1),
  color: z.string().min(1),
  hardness: z.string().min(1),
  origin: z.string().min(1),
});

// Merged stone (ko + en)
export const StoneSchema = z.object({
  month: z.number().int().min(1).max(12),
  ko: LocalizedStoneSchema,
  en: LocalizedStoneSchema,
  googleQuery: z.object({
    ko: z.string().min(1),
    en: z.string().min(1),
  }),
});

export type LocalizedStone = z.infer<typeof LocalizedStoneSchema>;
export type MergedStone = z.infer<typeof StoneSchema>;

// Localized flower data
const LocalizedFlowerSchema = z.object({
  name: z.string().min(1),
  meaning: z.string().min(1),
});

// Merged flower (ko + en)
export const FlowerSchema = z.object({
  key: MonthDaySchema,
  ko: LocalizedFlowerSchema,
  en: LocalizedFlowerSchema,
  googleQuery: z.object({
    ko: z.string().min(1),
    en: z.string().min(1),
  }),
});

export type LocalizedFlower = z.infer<typeof LocalizedFlowerSchema>;
export type MergedFlower = z.infer<typeof FlowerSchema>;

// Merged color (ko + en)
export const ColorSchema = z.object({
  key: MonthDaySchema,
  hex: z.string().regex(HEX_RE, 'Must be valid hex color #RRGGBB'),
  ko: z.object({
    name: z.string().min(1),
    keyword: z.string().min(1),
  }),
  en: z.object({
    name: z.string().min(1),
    keyword: z.string().min(1),
  }),
});

export type MergedColor = z.infer<typeof ColorSchema>;

// Localized month data
const LocalizedMonthSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

// Merged month (ko + en)
export const MONTH_SLUGS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

export type MonthSlug = (typeof MONTH_SLUGS)[number];

export const MonthSchema = z.object({
  month: z.number().int().min(1).max(12),
  slug: z.enum(MONTH_SLUGS),
  ko: LocalizedMonthSchema,
  en: LocalizedMonthSchema,
});

export type MergedMonth = z.infer<typeof MonthSchema>;

// Full catalog
export const CatalogSchema = z.object({
  stones: z.array(StoneSchema),
  flowers: z.record(MonthDaySchema, FlowerSchema),
  colors: z.record(MonthDaySchema, ColorSchema),
  months: z.array(MonthSchema),
});

export type BirthdayCatalog = z.infer<typeof CatalogSchema>;

// Birth profile (result of building from MM-DD)
export const BirthProfileSchema = z.object({
  date: MonthDaySchema,
  month: z.number().int().min(1).max(12),
  flower: FlowerSchema,
  stone: StoneSchema,
  color: ColorSchema,
});

export type BirthProfile = z.infer<typeof BirthProfileSchema>;

// Locale type
export type Locale = 'ko' | 'en';
