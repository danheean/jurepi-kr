#!/usr/bin/env node

/**
 * Build-time generator: scan content/new-word/terms/, parse markdown,
 * validate, merge ko+en pairs, and emit terms.generated.json.
 *
 * Deterministic: no Date/random, exit 0 on success, 1 on any validation failure.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * Re-declare schemas for Node.js (cannot import .ts directly).
 * Keep in sync with src/lib/new-word/schema.ts.
 */
const TermFileFrontSchema = z.object({
  term: z.string().min(1, 'term required'),
  definition: z.string().min(1, 'definition required'),
  examples: z.array(z.string().min(1)).min(1, '≥1 example required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  topic: z.enum(['mz', 'tech']).optional(),
  reading: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  origin: z.string().optional(),
  coinedYear: z.number().int().optional(),
  related: z.array(z.string()).optional(),
});

const MergedTermSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.enum(['mz', 'tech']),
  tags: z.array(z.string()),
  coinedYear: z.number().int().optional(),
  related: z.array(z.string()),
  ko: z.object({
    term: z.string(),
    definition: z.string(),
    examples: z.array(z.string()),
    body: z.string(),
    reading: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    origin: z.string().optional(),
  }),
  en: z.object({
    term: z.string(),
    definition: z.string(),
    examples: z.array(z.string()),
    body: z.string(),
    reading: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    origin: z.string().optional(),
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
 * Check if two arrays are equal (order matters).
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Merge ko + en pair following canonical rule.
 */
function mergePair(koFront, enFront, koBody = '', enBody = '', koFilename = 'unknown.md') {
  const slug = resolveSlug(koFront, koFilename);
  const topic = koFront.topic || 'mz';
  const tags = koFront.tags || [];
  const related = koFront.related || [];

  return {
    slug,
    topic,
    tags,
    coinedYear: koFront.coinedYear,
    related,
    ko: {
      term: koFront.term,
      definition: koFront.definition,
      examples: koFront.examples,
      body: koBody,
      reading: koFront.reading,
      aliases: koFront.aliases,
      origin: koFront.origin,
    },
    en: {
      term: enFront.term,
      definition: enFront.definition,
      examples: enFront.examples,
      body: enBody,
      reading: enFront.reading,
      aliases: enFront.aliases,
      origin: enFront.origin,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 */
function validatePair(koFilename, koFront, enFront) {
  const errors = [];

  const koResult = TermFileFrontSchema.safeParse(koFront);
  const enResult = TermFileFrontSchema.safeParse(enFront);

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
    return { term: null, errors };
  }

  const ko = koResult.data;
  const en = enResult.data;

  if (en.topic && en.topic !== ko.topic) {
    errors.push(
      `${koFilename}: EN topic must match KO (KO="${ko.topic}", EN="${en.topic}")`
    );
  }
  if (
    en.tags &&
    en.tags.length > 0 &&
    !arraysEqual(en.tags, ko.tags || [])
  ) {
    errors.push(`${koFilename}: EN tags must match KO`);
  }

  const term = mergePair(ko, en, '', '');

  return { term: errors.length === 0 ? term : null, errors };
}

/**
 * Main generator function.
 */
async function generateGlossary() {
  const cwd = process.cwd();
  const termsDir = join(cwd, 'content/new-word/terms');
  const outputDir = join(cwd, 'src/components/tools/new-word/data');
  const outputPath = join(outputDir, 'terms.generated.json');

  const allErrors = [];
  let files;

  // 1. Scan and list files
  try {
    files = readdirSync(termsDir).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_')
    );
  } catch (err) {
    console.error(`Error reading terms directory: ${err.message}`);
    process.exit(1);
  }

  // 2. Group into ko/en pairs
  const pairs = new Map();
  files.forEach((file) => {
    try {
      const content = readFileSync(join(termsDir, file), 'utf8');
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
  const terms = [];
  pairs.forEach(({ ko, en }, base) => {
    if (!ko || !en) {
      allErrors.push(
        `${base}: missing ${!ko ? 'Korean' : 'English'} file`
      );
      return;
    }

    const { term, errors } = validatePair(base, ko.data, en.data);
    if (errors.length > 0) {
      allErrors.push(...errors);
    }

    if (term) {
      try {
        const koPath = join(termsDir, ko.filename);
        const enPath = join(termsDir, en.filename);
        const koContent = readFileSync(koPath, 'utf8');
        const enContent = readFileSync(enPath, 'utf8');
        const mergedTerm = mergePair(
          ko.data,
          en.data,
          matter(koContent).content.trim(),
          matter(enContent).content.trim(),
          ko.filename
        );
        terms.push(mergedTerm);
      } catch (err) {
        allErrors.push(`${base}: body read error — ${err.message}`);
      }
    }
  });

  // 4. Validate uniqueness and references
  const slugSet = new Set(terms.map((t) => t.slug));
  const slugList = terms.map((t) => t.slug);

  // Check slug uniqueness
  const duplicates = slugList.filter(
    (slug, idx) => slugList.indexOf(slug) !== idx
  );
  if (duplicates.length > 0) {
    allErrors.push(`Duplicate slugs: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check related references
  terms.forEach((term) => {
    term.related.forEach((ref) => {
      if (!slugSet.has(ref)) {
        allErrors.push(
          `${term.slug}: related references missing slug "${ref}"`
        );
      }
    });
  });

  // 5. Final validation: each term passes MergedTermSchema
  terms.forEach((term) => {
    const result = MergedTermSchema.safeParse(term);
    if (!result.success) {
      allErrors.push(
        `${term.slug}: final validation error — ${result.error.message}`
      );
    }
  });

  // 6. Exit if errors
  if (allErrors.length > 0) {
    console.error('Build errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  // 7. Sort: topic → coinedYear desc → term
  terms.sort((a, b) => {
    const topicOrder = { mz: 0, tech: 1 };
    if (topicOrder[a.topic] !== topicOrder[b.topic]) {
      return topicOrder[a.topic] - topicOrder[b.topic];
    }
    const aYear = a.coinedYear || 0;
    const bYear = b.coinedYear || 0;
    if (bYear !== aYear) {
      return bYear - aYear;
    }
    return a.ko.term.localeCompare(b.ko.term, 'ko');
  });

  // 8. Ensure output directory exists
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating output directory: ${err.message}`);
    process.exit(1);
  }

  // 9. Write output
  try {
    writeFileSync(
      outputPath,
      JSON.stringify(terms, null, 2),
      'utf8'
    );
    console.log(`✓ Generated ${terms.length} terms → ${outputPath}`);
  } catch (err) {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  }
}

generateGlossary().catch((err) => {
  console.error('Generator error:', err);
  process.exit(1);
});
