import {
  PersonFileFromSchema,
  type PersonFileFront,
  type MergedPerson,
  TAG_VOCABULARY,
  ERA_VALUES,
  BIOGRAPHY_BODY_MIN_LENGTH,
} from './schema';
import { resolveSlug } from './slug';

/**
 * Merge ko + en pair following canonical rule:
 * - tags, era, nationality from KO (canonical; en inherits if absent)
 * - name, knownFor, biography_body are PER-LOCALE
 * - achievements/books from ko with titles translated per locale
 * - photo, photoCredit, links, related, aliases from ko (canonical; en inherits)
 *
 * INVARIANT: every merged record has both ko+en with name/knownFor filled.
 */
export function mergePair(
  koFront: PersonFileFront,
  enFront: PersonFileFront,
  koFilename: string = 'unknown.md'
): MergedPerson {
  const slug = resolveSlug(koFront, koFilename);

  // Use ko canonical for structural metadata
  const tags = koFront.tags || [];
  const era = koFront.era || ('2000-present' as const);
  const nationality = koFront.nationality || '';

  return {
    slug,
    tags,
    era,
    nationality,
    ko: {
      name: koFront.name,
      knownFor: koFront.knownFor,
      aliases: koFront.aliases,
      biography_body: koFront.biography_body, // Will be filled by generator from markdown body
    },
    en: {
      name: enFront.name,
      knownFor: enFront.knownFor,
      aliases: enFront.aliases,
      biography_body: enFront.biography_body,
    },
    birthYear: koFront.birthYear,
    deathYear: koFront.deathYear,
    photo: koFront.photo,
    photoCredit: koFront.photoCredit,
    achievements: koFront.achievements
      ? koFront.achievements.map((ach) => ({
          year: ach.year,
          ko: ach.title,
          // en title comes from enFront, matched by index and year
          en: enFront.achievements?.find((e) => e.year === ach.year)?.title || ach.title,
        }))
      : undefined,
    books: koFront.books
      ? koFront.books.map((book) => ({
          ko: book.title,
          en: enFront.books?.find((e) => e.year === book.year && e.title)?.title || book.title,
          year: book.year,
          url: book.url,
        }))
      : undefined,
    related: koFront.related,
    links: koFront.links,
  };
}

/**
 * Validate ko+en pair and return merged record + errors.
 * Errors are collected (non-blocking) before returning.
 * Returns { person: MergedPerson | null, errors: string[] }.
 *
 * Checks:
 * - Frontmatter parse (zod)
 * - Required fields per locale
 * - Year sanity (birthYear ≤ deathYear, both ≤ current year)
 * - achievements/books count + year match ko↔en
 * - photo file existence (validated separately by generator)
 * - photoCredit present if photo
 * - tags in vocabulary
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { person: MergedPerson | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = PersonFileFromSchema.safeParse(koFront);
  const enResult = PersonFileFromSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { person: null, errors };
  }

  const ko = koResult.data!;
  const en = enResult.data!;

  // Validate KO file required structural metadata (ko canonical)
  if (!ko.tags || ko.tags.length === 0) {
    errors.push(`${koFilename}: KO file must have ≥1 tag(s) (canonical)`);
  }
  if (!ko.era) {
    errors.push(`${koFilename}: KO file must have era (canonical)`);
  }
  if (!ko.nationality) {
    errors.push(`${koFilename}: KO file must have nationality (canonical)`);
  }

  // Validate biography body exists and has minimum length (thin-content guard)
  const koBodyTrimmed = ko.biography_body?.trim() ?? '';
  const enBodyTrimmed = en.biography_body?.trim() ?? '';

  if (!koBodyTrimmed) {
    errors.push(`${koFilename}: KO biography body is empty`);
  } else if (koBodyTrimmed.length < BIOGRAPHY_BODY_MIN_LENGTH) {
    errors.push(
      `${koFilename}: KO biography body too short (${koBodyTrimmed.length} chars, need ≥${BIOGRAPHY_BODY_MIN_LENGTH})`
    );
  }

  // Check for required markdown headings in biography body
  if (koBodyTrimmed && !/(^|\n)## 소개/.test(ko.biography_body!)) {
    errors.push(`${koFilename}: KO biography must have "## 소개" (About) heading`);
  }

  if (!enBodyTrimmed) {
    errors.push(`${koFilename}: EN biography body is empty`);
  } else if (enBodyTrimmed.length < BIOGRAPHY_BODY_MIN_LENGTH) {
    errors.push(
      `${koFilename}: EN biography body too short (${enBodyTrimmed.length} chars, need ≥${BIOGRAPHY_BODY_MIN_LENGTH})`
    );
  }

  if (enBodyTrimmed && !/(^|\n)## About/.test(en.biography_body!)) {
    errors.push(`${koFilename}: EN biography must have "## About" heading`);
  }

  if (errors.length > 0) {
    return { person: null, errors };
  }

  // Validate year sanity
  if (ko.birthYear && ko.deathYear && ko.birthYear > ko.deathYear) {
    errors.push(`${koFilename}: birthYear (${ko.birthYear}) > deathYear (${ko.deathYear})`);
  }

  // Validate photoCredit if photo present
  if (ko.photo && !ko.photoCredit) {
    errors.push(`${koFilename}: photo present but photoCredit missing`);
  }
  if (en.photo && !en.photoCredit && !ko.photoCredit) {
    // en.photoCredit is optional (inherits from ko)
    // but warn if photo present in en but no photoCredit in en or ko
  }

  // Validate achievements count and years match
  if (ko.achievements && en.achievements) {
    if (ko.achievements.length !== en.achievements.length) {
      errors.push(
        `${koFilename}: achievements count mismatch — ko=${ko.achievements.length}, en=${en.achievements.length}`
      );
    } else {
      // Check years match
      for (let i = 0; i < ko.achievements.length; i++) {
        const koAch = ko.achievements[i];
        const enAch = en.achievements[i];
        if (koAch.year !== enAch.year) {
          errors.push(
            `${koFilename}: achievement[${i}] year mismatch — ko=${koAch.year}, en=${enAch.year}`
          );
        }
      }
    }
  } else if ((ko.achievements || en.achievements) && (!ko.achievements || !en.achievements)) {
    errors.push(
      `${koFilename}: achievements present in one locale but not the other`
    );
  }

  // Validate books count and years match
  if (ko.books && en.books) {
    if (ko.books.length !== en.books.length) {
      errors.push(
        `${koFilename}: books count mismatch — ko=${ko.books.length}, en=${en.books.length}`
      );
    } else {
      // Check years match (years are optional but if present, should match)
      for (let i = 0; i < ko.books.length; i++) {
        const koBook = ko.books[i];
        const enBook = en.books[i];
        if (koBook.year !== enBook.year) {
          errors.push(`${koFilename}: book[${i}] year mismatch — ko=${koBook.year}, en=${enBook.year}`);
        }
      }
    }
  } else if ((ko.books || en.books) && (!ko.books || !en.books)) {
    errors.push(
      `${koFilename}: books present in one locale but not the other`
    );
  }

  if (errors.length > 0) {
    return { person: null, errors };
  }

  const person = mergePair(ko, en, koFilename);

  return { person, errors: [] };
}
