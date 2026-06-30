import { z } from 'zod';

export const STORE_VERSION = 1;

/**
 * Entry schema: a user's answer for one calendar date.
 */
export const EntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  questionKey: z.string().regex(/^\d{2}-\d{2}$/),
  text: z.string().max(4000),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

export type Entry = z.infer<typeof EntrySchema>;

/**
 * Store schema: the complete localStorage blob.
 */
export const StoreSchema = z.object({
  version: z.number().int().min(1),
  entries: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), EntrySchema),
  meta: z.object({
    createdAt: z.number().int().nonnegative(),
    lastBackupAt: z.number().int().nonnegative().optional(),
    reminderDismissedAt: z.number().int().nonnegative().optional(),
  }),
});

export type Store = z.infer<typeof StoreSchema>;

/**
 * Migrate raw JSON to the latest Store schema.
 * Currently identity (v1 → v1); future versions will upgrade.
 */
export function migrate(raw: unknown): Store {
  const parsed = StoreSchema.parse(raw);
  // Version 1 is current; no migration needed yet.
  return parsed;
}
