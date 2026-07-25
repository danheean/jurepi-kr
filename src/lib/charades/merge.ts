import { DeckFileSchema, MergedDeckSchema, type DeckFile, type MergedDeck } from './schema';
import { resolveSlug } from './slug';

/**
 * Merge ko+en pair into canonical MergedDeck
 * Rule: ko is canonical for category/difficulty/words
 *       en inherits category/difficulty if absent; title is per-locale; words per-locale (or inherit ko)
 */
export function mergePair(
  koFront: DeckFile,
  enFront: DeckFile,
  slug: string
): MergedDeck {
  const words = koFront.words || [];
  const category = koFront.category || 'actions'; // ko must have category (validatePair enforces this)
  const difficulty = koFront.difficulty || 'easy'; // ko must have difficulty (validatePair enforces this)

  return {
    slug,
    category,
    difficulty,
    words, // canonical from ko
    ko: {
      title: koFront.title || '',
      words, // ko words
    },
    en: {
      title: enFront.title || '',
      words: enFront.words || words, // en words or inherit ko
    },
  };
}

/**
 * Validate ko+en pair and return { deck, errors[] }
 * Validates:
 * - Ko has required fields (title, category, difficulty, words ≥10)
 * - En has required fields (title)
 * - En words length == ko words length (if present)
 * - Word terms are unique within each deck
 */
export function validatePair(
  koFront: DeckFile,
  enFront: DeckFile,
  koFilename: string,
  enFilename: string
): { deck: MergedDeck | null; errors: string[] } {
  const errors: string[] = [];

  // Validate ko frontmatter
  const koResult = DeckFileSchema.safeParse(koFront);
  if (!koResult.success) {
    const flattened = koResult.error.flatten();
    Object.entries(flattened.fieldErrors).forEach(([field, msgs]) => {
      msgs?.forEach((msg) => {
        errors.push(`${koFilename}: ${field} — ${msg}`);
      });
    });
  }

  // Validate en frontmatter
  const enResult = DeckFileSchema.safeParse(enFront);
  if (!enResult.success) {
    const flattened = enResult.error.flatten();
    Object.entries(flattened.fieldErrors).forEach(([field, msgs]) => {
      msgs?.forEach((msg) => {
        errors.push(`${enFilename}: ${field} — ${msg}`);
      });
    });
  }

  // Additional validation: ko must have category, difficulty, words (canonical)
  if (!koFront.category) {
    errors.push(`${koFilename}: category — required (canonical in ko)`);
  }
  if (!koFront.difficulty) {
    errors.push(`${koFilename}: difficulty — required (canonical in ko)`);
  }
  if (!koFront.words) {
    errors.push(`${koFilename}: words — required (canonical in ko)`);
  }

  // Additional validation: en.title required
  if (!enFront.title) {
    errors.push(`${enFilename}: title — required`);
  }

  // Check en.words length matches ko.words length (if present)
  if (koFront.words && enFront.words && koFront.words.length !== enFront.words.length) {
    errors.push(
      `${enFilename}: words — length must match ko (ko: ${koFront.words.length}, en: ${enFront.words.length})`
    );
  }

  // Check for duplicate terms in ko
  if (koFront.words) {
    const koTerms = koFront.words.map((w) => w.term);
    const koUnique = new Set(koTerms);
    if (koUnique.size !== koTerms.length) {
      errors.push(`${koFilename}: words — terms must be unique within deck`);
    }
  }

  // Check for duplicate terms in en
  if (enFront.words) {
    const enTerms = enFront.words.map((w) => w.term);
    const enUnique = new Set(enTerms);
    if (enUnique.size !== enTerms.length) {
      errors.push(`${enFilename}: words — terms must be unique within deck`);
    }
  }

  if (errors.length > 0) {
    return { deck: null, errors };
  }

  // Resolve slug from ko file (or filename)
  const slug = resolveSlug(koFront, koFilename);

  const deck = mergePair(koFront, enFront, slug);
  const deckResult = MergedDeckSchema.safeParse(deck);
  if (!deckResult.success) {
    const flattened = deckResult.error.flatten();
    Object.entries(flattened.fieldErrors).forEach(([field, msgs]) => {
      msgs?.forEach((msg) => {
        errors.push(`merged: ${field} — ${msg}`);
      });
    });
    return { deck: null, errors };
  }

  return { deck, errors: [] };
}
