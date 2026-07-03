import { z } from 'zod';
import { DateKey, parseDateKey } from './date';

// Re-export DateKey for convenience
export type { DateKey } from './date';

/**
 * BirthdateInput: validated user input
 * - Must be valid YYYY-MM-DD
 * - Must not be a future date
 * - Must not be >150 years old
 */
export const BirthdateInputSchema = z.object({
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required'),
}).refine(
  (data) => {
    // Parse and validate the date
    const [y, m, d] = data.birthdate.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    // Reject invalid dates like Feb 30
    if (date.getMonth() !== m - 1 || date.getDate() !== d) {
      return false;
    }

    // Check not future
    const now = new Date();
    if (date > now) {
      return false;
    }

    // Check not >150 years old
    const oneHundredFiftyYearsAgo = new Date();
    oneHundredFiftyYearsAgo.setFullYear(oneHundredFiftyYearsAgo.getFullYear() - 150);
    if (date < oneHundredFiftyYearsAgo) {
      return false;
    }

    return true;
  },
  { message: 'Invalid birthdate' }
);

export type BirthdateInput = z.infer<typeof BirthdateInputSchema>;

/**
 * Person: an individual saved person with id, name, birthdate
 */
export const PersonSchema = z.object({
  id: z.string().min(1, 'ID required'),
  name: z.string().min(1, 'Name required'),
  // The birthdate as ENTERED — solar or lunar depending on calendarType.
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required'),
  // Calendar the birthdate was entered in. Older records without these fields
  // default to solar (backward compatible).
  calendarType: z.enum(['solar', 'lunar']).default('solar'),
  isLeapMonth: z.boolean().default(false),
});

export type Person = z.infer<typeof PersonSchema>;

/**
 * PeopleStore: full store schema for localStorage persistence
 * - version: literal 1 (for migrations)
 * - people: array of max 20 people
 * - meta: creation/update timestamps
 */
export const PeopleStoreSchema = z.object({
  version: z.literal(1),
  people: z.array(PersonSchema).max(20, 'Max 20 people'),
  meta: z.object({
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
});

export type PeopleStore = z.infer<typeof PeopleStoreSchema>;

/**
 * Parse unknown input to BirthdateInput or null.
 * Safe-parse: never throws.
 */
export function parseBirthdateInput(input: unknown): BirthdateInput | null {
  const result = BirthdateInputSchema.safeParse(input);
  return result.success ? result.data : null;
}

/**
 * Parse unknown input to PeopleStore.
 * Fail-gracefully: invalid input → fresh empty store (never throws).
 */
export function parsePeopleStore(raw: unknown): PeopleStore {
  const result = PeopleStoreSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  // Return fresh empty store on parse failure
  const now = Date.now();
  return {
    version: 1,
    people: [],
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  };
}
