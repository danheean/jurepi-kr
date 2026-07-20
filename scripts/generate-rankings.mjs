#!/usr/bin/env node

/**
 * Build-time generator: scan content/rankings/, parse markdown,
 * validate, merge ko+en pairs, and emit rankings.generated.json.
 *
 * Deterministic: no Date/random, exit 0 on success, 1 on any validation failure.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

// Re-declare schemas (keep in sync with src/lib/rankings/schema.ts)
const RankingFileFrontSchema = z.object({
  title: z.string().min(1, 'title required'),
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music', 'sports', 'education', 'business']),
  asOfDate: z.string().min(1, 'asOfDate required (ISO date: YYYY-MM or YYYY-MM-DD)'),
  sourceNote: z.string().min(1).max(200, 'sourceNote max 200 chars'),
  sourceUrl: z.string().url().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  items: z.array(
    z.object({
      rank: z.number().int().positive(),
      name: z.string().min(1, 'item name required'),
      description: z.string().min(1).max(200, 'item description max 200 chars'),
      link: z.string().url().optional(),
      imageUrl: z.string().url().optional(),
      imageWidth: z.number().int().positive().optional(),
      imageHeight: z.number().int().positive().optional(),
    })
  ).min(3, '≥3 items per ranking'),
});

const MergedRankingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music', 'sports', 'education', 'business']),
  asOfDate: z.string(),
  sourceUrl: z.string().url().optional(),
  ko: z.object({
    title: z.string(),
    sourceNote: z.string(),
    items: z.array(
      z.object({
        rank: z.number().int(),
        name: z.string(),
        description: z.string(),
        link: z.string().optional(),
        imageUrl: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      })
    ),
  }),
  en: z.object({
    title: z.string(),
    sourceNote: z.string(),
    items: z.array(
      z.object({
        rank: z.number().int(),
        name: z.string(),
        description: z.string(),
        link: z.string().optional(),
        imageUrl: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      })
    ),
  }),
});

/**
 * Slugify: convert string to lowercase, remove diacritics, replace spaces with hyphens.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/-+/g, '-') // Collapse hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 */
function resolveSlug(front, filename) {
  if (front.slug) {
    return front.slug;
  }
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}

/**
 * Merge ko + en pair following canonical rule.
 * sourceNote is per-locale; EN can differ from KO or inherit if omitted.
 */
function mergePair(koFront, enFront, koFilename = 'unknown.md') {
  const slug = resolveSlug(koFront, koFilename);
  const field = koFront.field;
  const asOfDate = koFront.asOfDate;
  const sourceUrl = koFront.sourceUrl;

  // EN sourceNote can be different or omit to inherit from KO
  const enSourceNote = enFront.sourceNote ?? koFront.sourceNote;

  return {
    slug,
    field,
    asOfDate,
    sourceUrl,
    ko: {
      title: koFront.title,
      sourceNote: koFront.sourceNote,
      items: koFront.items,
    },
    en: {
      title: enFront.title,
      sourceNote: enSourceNote,
      items: enFront.items,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 * EN sourceNote can differ from KO (localized), or inherit if omitted.
 */
function validatePair(koFilename, koFront, enFront) {
  const errors = [];

  const koResult = RankingFileFrontSchema.safeParse(koFront);
  const enResult = RankingFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(
      `${koFilename}: KO parse error — ${koResult.error.message}`
    );
  }
  if (!enResult.success) {
    errors.push(
      `${koFilename}: EN parse error — ${enResult.error.message}`
    );
  }

  if (errors.length > 0) {
    return { ranking: null, errors };
  }

  const ko = koResult.data;
  const en = enResult.data;

  // Canonical rule check: EN field/asOfDate/sourceUrl must match KO if present
  if (en.field && en.field !== ko.field) {
    errors.push(
      `${koFilename}: EN field must match KO (KO="${ko.field}", EN="${en.field}")`
    );
  }
  if (en.asOfDate && en.asOfDate !== ko.asOfDate) {
    errors.push(
      `${koFilename}: EN asOfDate must match KO (KO="${ko.asOfDate}", EN="${en.asOfDate}")`
    );
  }
  if (en.sourceUrl && en.sourceUrl !== ko.sourceUrl) {
    errors.push(
      `${koFilename}: EN sourceUrl must match KO`
    );
  }

  const ranking = mergePair(ko, en, koFilename);

  return { ranking: errors.length === 0 ? ranking : null, errors };
}

/**
 * Main generator function.
 */
async function generateRankings() {
  const cwd = process.cwd();
  const rankingsDir = join(cwd, 'content/rankings/items');
  const outputDir = join(cwd, 'src/components/tools/rankings/data');
  const outputPath = join(outputDir, 'rankings.generated.json');

  const allErrors = [];
  let files;

  // 1. Scan and list files
  try {
    files = readdirSync(rankingsDir).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_')
    );
  } catch (err) {
    console.error(`Error reading rankings directory: ${err.message}`);
    process.exit(1);
  }

  // 2. Group into ko/en pairs
  const pairs = new Map();
  files.forEach((file) => {
    try {
      const content = readFileSync(join(rankingsDir, file), 'utf8');
      const { data } = matter(content);
      const base = file.replace(/(_en)?\.md$/, '');
      const isEn = file.endsWith('_en.md');

      if (!pairs.has(base)) {
        pairs.set(base, {});
      }
      pairs.get(base)[isEn ? 'en' : 'ko'] = { filename: file, data };
    } catch (err) {
      allErrors.push(`${file}: read/parse error — ${err.message}`);
    }
  });

  // 3. Merge and validate pairs
  const rankings = [];
  pairs.forEach(({ ko, en }, base) => {
    if (!ko || !en) {
      allErrors.push(
        `${base}: missing ${!ko ? 'Korean' : 'English'} file`
      );
      return;
    }

    const { ranking, errors } = validatePair(base, ko.data, en.data);
    if (errors.length > 0) {
      allErrors.push(...errors);
    }

    if (ranking) {
      rankings.push(ranking);
    }
  });

  // 4. Validate uniqueness per field
  const slugSet = new Map(); // field -> Set<slug>
  rankings.forEach((ranking) => {
    if (!slugSet.has(ranking.field)) {
      slugSet.set(ranking.field, new Set());
    }
    const fieldSlugs = slugSet.get(ranking.field);
    if (fieldSlugs.has(ranking.slug)) {
      allErrors.push(
        `Duplicate slug "${ranking.slug}" in field "${ranking.field}"`
      );
    } else {
      fieldSlugs.add(ranking.slug);
    }
  });

  // 5. Validate ranks are consecutive (1..N) for each ranking
  rankings.forEach((ranking) => {
    const validateSequence = (items, locale) => {
      const ranks = items.map(i => i.rank).sort((a, b) => a - b);
      for (let i = 0; i < ranks.length; i++) {
        if (ranks[i] !== i + 1) {
          allErrors.push(
            `${ranking.slug} (${locale}): ranks must be consecutive 1..N, got gap at position ${i + 1}`
          );
          break;
        }
      }
    };
    validateSequence(ranking.ko.items, 'ko');
    validateSequence(ranking.en.items, 'en');
  });

  // 6. Final validation: each ranking passes MergedRankingSchema
  rankings.forEach((ranking) => {
    const result = MergedRankingSchema.safeParse(ranking);
    if (!result.success) {
      allErrors.push(
        `${ranking.slug}: final validation error — ${result.error.message}`
      );
    }
  });

  // 7. Exit if errors
  if (allErrors.length > 0) {
    console.error('Build errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  // 8. Sort: field order → asOfDate desc → title ko locale
  const fieldOrder = ['ai', 'programming', 'tech', 'games', 'movies', 'music', 'sports', 'education', 'business'];
  rankings.sort((a, b) => {
    const fieldIdxA = fieldOrder.indexOf(a.field);
    const fieldIdxB = fieldOrder.indexOf(b.field);
    if (fieldIdxA !== fieldIdxB) {
      return fieldIdxA - fieldIdxB;
    }
    // asOfDate descending (newer first)
    if (a.asOfDate !== b.asOfDate) {
      return b.asOfDate.localeCompare(a.asOfDate);
    }
    // title ascending (ko locale)
    return a.ko.title.localeCompare(b.ko.title, 'ko');
  });

  // 9. Ensure output directory exists
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating output directory: ${err.message}`);
    process.exit(1);
  }

  // 10. Write output
  try {
    writeFileSync(
      outputPath,
      JSON.stringify(rankings, null, 2),
      'utf8'
    );
    console.log(`✓ Generated ${rankings.length} rankings → ${outputPath}`);
  } catch (err) {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  }
}

generateRankings().catch((err) => {
  console.error('Generator error:', err);
  process.exit(1);
});
