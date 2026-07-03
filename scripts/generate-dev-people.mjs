#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// cwd-based so fixture tests can run the generator against a temp root (same as generate-glossary.mjs)
const ROOT = process.cwd();

// Schema definitions (mirror of src/lib/dev-people/schema.ts)
const TAG_VOCABULARY = [
  'java',
  'python',
  'javascript',
  'c',
  'cpp',
  'linux',
  'git',
  'ai',
  'deep-learning',
  'clean-code',
  'architecture',
  'tdd',
  'agile',
  'refactoring',
  'design-patterns',
  'free-software',
  'web',
  'game',
  'education',
  'youtube',
];

const ERA_VALUES = ['1940-1960', '1960-1980', '1980-2000', '2000-present'];

// SPEC security rule: only http(s) URLs (reject javascript:/data:/ftp: …)
const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'URL must use http(s) scheme');

const PersonFileFromSchema = z.object({
  name: z.string().min(1, 'name required'),
  knownFor: z.string().min(50, 'knownFor must be ≥50 chars'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  tags: z.array(z.enum(TAG_VOCABULARY)).optional(),
  era: z.enum(ERA_VALUES).optional(),
  nationality: z.string().optional(),
  birthYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  deathYear: z.number().int().optional(),
  photo: z.string().optional(),
  photoCredit: z.string().optional(),
  achievements: z
    .array(z.object({ year: z.number().int(), title: z.string().min(1) }))
    .optional(),
  books: z
    .array(z.object({ title: z.string().min(1), year: z.number().int().optional(), url: httpUrl.optional() }))
    .optional(),
  aliases: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  links: z
    .array(z.object({ label: z.string().min(1), url: httpUrl }))
    .optional(),
  // markdown body injected by the scanner (gray-matter content) — without this key zod strips it
  biography_body: z.string().optional(),
});

const BODY_MIN_CHARS = 100; // thin-content guard: substantial biography required

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function resolveSlug(front, koFilename) {
  if (front.slug) {
    if (!/^[a-z0-9-]+$/.test(front.slug)) {
      throw new Error(`Invalid slug in ${koFilename}: "${front.slug}" must be ASCII alphanumeric + hyphens`);
    }
    return front.slug;
  }
  const derived = slugify(front.name);
  if (!derived) {
    throw new Error(`Cannot derive slug from name "${front.name}" in ${koFilename}`);
  }
  return derived;
}

function mergePair(koFront, enFront, koFilename) {
  const slug = resolveSlug(koFront, koFilename);
  const tags = koFront.tags || [];
  const era = koFront.era || '2000-present';
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
      biography_body: koFront.biography_body,
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
    // index-based pairing: counts and years are validated equal before merge,
    // and year-based lookup breaks when two entries share a year
    achievements: koFront.achievements
      ? koFront.achievements.map((ach, i) => ({
          year: ach.year,
          ko: ach.title,
          en: enFront.achievements?.[i]?.title || ach.title,
        }))
      : undefined,
    books: koFront.books
      ? koFront.books.map((book, i) => ({
          ko: book.title,
          en: enFront.books?.[i]?.title || book.title,
          year: book.year,
          url: book.url,
        }))
      : undefined,
    related: koFront.related,
    links: koFront.links,
  };
}

function validatePair(koFilename, koFront, enFront) {
  const errors = [];

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

  const ko = koResult.data;
  const en = enResult.data;

  // Korean file is the canonical carrier of structural metadata (SPEC)
  if (!ko.tags || ko.tags.length === 0) {
    errors.push(`${koFilename}: KO file must declare at least one tag`);
  }
  if (!ko.era) {
    errors.push(`${koFilename}: KO file must declare era`);
  }
  if (!ko.nationality) {
    errors.push(`${koFilename}: KO file must declare nationality`);
  }

  // Thin-content guard: both locales need a substantial biography body with the required heading
  const koBody = (ko.biography_body || '').trim();
  const enBody = (en.biography_body || '').trim();
  if (!/^##\s*소개\s*$/m.test(koBody)) {
    errors.push(`${koFilename}: KO body must contain a "## 소개" section`);
  }
  if (!/^##\s*About\s*$/m.test(enBody)) {
    errors.push(`${koFilename}: EN body must contain a "## About" section`);
  }
  if (koBody.replace(/\s/g, '').length < BODY_MIN_CHARS) {
    errors.push(`${koFilename}: KO body too thin (<${BODY_MIN_CHARS} chars) — write a real biography`);
  }
  if (enBody.replace(/\s/g, '').length < BODY_MIN_CHARS) {
    errors.push(`${koFilename}: EN body too thin (<${BODY_MIN_CHARS} chars) — write a real biography`);
  }

  // Year sanity
  if (ko.birthYear && ko.deathYear && ko.birthYear > ko.deathYear) {
    errors.push(`${koFilename}: birthYear (${ko.birthYear}) > deathYear (${ko.deathYear})`);
  }

  // photoCredit if photo present
  if (ko.photo && !ko.photoCredit) {
    errors.push(`${koFilename}: photo present but photoCredit missing`);
  }

  // achievements count and years match
  if (ko.achievements && en.achievements) {
    if (ko.achievements.length !== en.achievements.length) {
      errors.push(
        `${koFilename}: achievements count mismatch — ko=${ko.achievements.length}, en=${en.achievements.length}`
      );
    } else {
      for (let i = 0; i < ko.achievements.length; i++) {
        if (ko.achievements[i].year !== en.achievements[i].year) {
          errors.push(
            `${koFilename}: achievement[${i}] year mismatch — ko=${ko.achievements[i].year}, en=${en.achievements[i].year}`
          );
        }
      }
    }
  } else if ((ko.achievements || en.achievements) && (!ko.achievements || !en.achievements)) {
    errors.push(`${koFilename}: achievements present in one locale but not the other`);
  }

  // books count and years match
  if (ko.books && en.books) {
    if (ko.books.length !== en.books.length) {
      errors.push(
        `${koFilename}: books count mismatch — ko=${ko.books.length}, en=${en.books.length}`
      );
    } else {
      for (let i = 0; i < ko.books.length; i++) {
        if (ko.books[i].year !== en.books[i].year) {
          errors.push(
            `${koFilename}: book[${i}] year mismatch — ko=${ko.books[i].year}, en=${en.books[i].year}`
          );
        }
      }
    }
  } else if ((ko.books || en.books) && (!ko.books || !en.books)) {
    errors.push(`${koFilename}: books present in one locale but not the other`);
  }

  if (errors.length > 0) {
    return { person: null, errors };
  }

  const person = mergePair(ko, en, koFilename);
  return { person, errors: [] };
}

function main() {
  const contentDir = path.join(ROOT, 'content', 'dev-people', 'people');
  const outputDir = path.join(ROOT, 'src', 'components', 'tools', 'dev-people', 'data');

  console.log(`Scanning ${contentDir}…`);

  if (!fs.existsSync(contentDir)) {
    console.warn(`⚠ ${contentDir} does not exist yet. Skipping generation.`);
    // Create empty catalog for development
    const emptyOutput = {
      generatedAt: new Date().toISOString(),
      peoples: [],
    };

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
      path.join(outputDir, 'dev-people.generated.json'),
      JSON.stringify(emptyOutput, null, 2)
    );
    console.log(`✓ Created empty catalog at ${outputDir}`);
    return;
  }

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.md'));
  console.log(`Found ${files.length} markdown files`);

  // Group into pairs
  const pairs = new Map(); // base → { ko, en }

  for (const file of files) {
    if (file.startsWith('_')) {
      console.log(`  (skip ${file} — template)`);
      continue;
    }

    const base = file.replace(/_en\.md$/, '').replace(/\.md$/, '');
    const isEn = file.endsWith('_en.md');

    if (!pairs.has(base)) {
      pairs.set(base, {});
    }
    pairs.get(base)[isEn ? 'en' : 'ko'] = file;
  }

  // Validate pairs and parse
  const errors = [];
  const peoples = [];
  const seenSlugs = new Set();
  const photoDir = path.join(ROOT, 'public', 'images', 'dev-people');
  const photoExists = fs.existsSync(photoDir) ? new Set(fs.readdirSync(photoDir)) : new Set();

  for (const [base, pair] of pairs) {
    if (!pair.ko) {
      errors.push(`${base}: missing Korean file (${base}.md)`);
      continue;
    }
    if (!pair.en) {
      errors.push(`${base}: missing English file (${base}_en.md)`);
      continue;
    }

    const koPath = path.join(contentDir, pair.ko);
    const enPath = path.join(contentDir, pair.en);

    const koContent = fs.readFileSync(koPath, 'utf-8');
    const enContent = fs.readFileSync(enPath, 'utf-8');

    let koFile;
    let enFile;
    try {
      koFile = matter(koContent);
      enFile = matter(enContent);
    } catch (err) {
      errors.push(`${base}: YAML frontmatter parse error — ${err.message?.split('\n')[0]}`);
      continue;
    }

    const koFront = { ...koFile.data, biography_body: koFile.content };
    const enFront = { ...enFile.data, biography_body: enFile.content };

    const { person, errors: pairErrors } = validatePair(pair.ko, koFront, enFront);

    if (pairErrors.length > 0) {
      errors.push(...pairErrors);
      continue;
    }

    // Check photo file exists
    if (person.photo && !photoExists.has(person.photo)) {
      errors.push(`${pair.ko}: photo file "${person.photo}" not found in ${photoDir}`);
      continue;
    }

    // Check slug uniqueness
    if (seenSlugs.has(person.slug)) {
      errors.push(`${pair.ko}: slug "${person.slug}" is not unique`);
      continue;
    }
    seenSlugs.add(person.slug);

    // Check related references exist
    if (person.related && person.related.length > 0) {
      // We'll validate these after all people are loaded
      // For now, just note them
    }

    peoples.push(person);
  }

  // Validate related references exist
  const slugs = new Set(peoples.map((p) => p.slug));
  for (const person of peoples) {
    if (person.related && person.related.length > 0) {
      for (const relatedSlug of person.related) {
        if (!slugs.has(relatedSlug)) {
          errors.push(`${person.slug}: related person "${relatedSlug}" not found in catalog`);
        }
      }
    }
  }

  // Sort: era → tag → birthYear
  peoples.sort((a, b) => {
    const eraOrder = ['1940-1960', '1960-1980', '1980-2000', '2000-present'];
    const eraA = eraOrder.indexOf(a.era);
    const eraB = eraOrder.indexOf(b.era);
    if (eraA !== eraB) return eraA - eraB;

    const tagA = a.tags[0] || '';
    const tagB = b.tags[0] || '';
    if (tagA !== tagB) return tagA.localeCompare(tagB);

    return (a.birthYear || 9999) - (b.birthYear || 9999);
  });

  // Report errors
  if (errors.length > 0) {
    console.error('\n❌ Validation errors:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(`\n${errors.length} error(s) found. Build failed.`);
    process.exit(1);
  }

  // Write output
  fs.mkdirSync(outputDir, { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    version: 1,
    peoples,
  };

  const outFile = path.join(outputDir, 'dev-people.generated.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(`\n✓ Generated catalog: ${peoples.length} people`);
  console.log(`  Saved to: ${outFile}`);
}

main();
