#!/usr/bin/env node

/**
 * Build-time generator: scan content/restaurant-map/, parse markdown,
 * validate, merge ko+en pairs, emit restaurant-map.generated.json.
 *
 * Deterministic: no Date/random, exit 0 on success, 1 on any validation failure.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

// Inline schema definitions (keep in sync with src/lib/restaurant-map/schema.ts)
const REGION_ENUM = [
  'seoul',
  'busan',
  'daegu',
  'daejeon',
  'gwangju',
  'ulsan',
  'gyeonggi',
  'gangwon',
  'chungbuk',
  'chungnam',
  'jeonbuk',
  'jeonnam',
  'gyeongbuk',
  'gyeongnam',
  'jeju',
  'nationwide',
];

const CATEGORY_ENUM = [
  'cafe',
  'korean',
  'japanese',
  'chinese',
  'brunch',
  'bar',
  'dessert',
  'other',
];

const PlaceSchema = z.object({
  name: z.string().min(1, 'Place name is required'),
  lat: z.number().refine((lat) => lat >= 33 && lat <= 39, {
    message: 'Latitude must be between 33 and 39 (Korea bounds)',
  }),
  lng: z.number().refine((lng) => lng >= 124 && lng <= 132, {
    message: 'Longitude must be between 124 and 132 (Korea bounds)',
  }),
  category: z.enum(CATEGORY_ENUM),
  address: z.string().min(1, 'Address is required'),
  description: z.string().min(1, 'Description is required'),
  personalNote: z
    .string()
    .min(1, 'personalNote is required (non-empty)')
    .refine((val) => val.trim().length > 0, {
      message: 'personalNote cannot be empty or whitespace-only',
    }),
  link: z.string().url().optional(),
  priceRange: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageWidth: z.number().positive().optional(),
  imageHeight: z.number().positive().optional(),
  id: z.string().optional(),
});

const PlaceListFileFrontSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  region: z.enum(REGION_ENUM),
  city: z.string().optional(),
  asOfDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Invalid ISO date format'),
  sourceNote: z.string().min(1, 'sourceNote is required').max(200),
  sourceUrl: z.string().url().optional(),
  places: z.array(PlaceSchema).min(3, 'Must have at least 3 places'),
});

// EN file schema: region, asOfDate, sourceUrl, city can inherit from KO
const PlaceListFileEnFrontSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  region: z.enum(REGION_ENUM).optional(), // Can inherit from KO
  city: z.string().optional(),
  asOfDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Invalid ISO date format').optional(), // Can inherit from KO
  sourceNote: z.string().min(1, 'sourceNote is required').max(200),
  sourceUrl: z.string().url().optional(), // Can inherit from KO
  places: z.array(PlaceSchema).min(3, 'Must have at least 3 places'),
});

const MergedPlaceListSchema = z.object({
  slug: z.string(),
  region: z.enum(REGION_ENUM),
  city: z.string().optional(),
  asOfDate: z.string(),
  sourceUrl: z.string().url().optional(),
  ko: z.object({
    title: z.string(),
    sourceNote: z.string(),
    places: z.array(PlaceSchema),
  }),
  en: z.object({
    title: z.string(),
    sourceNote: z.string(),
    places: z.array(PlaceSchema),
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
 * region/asOfDate/sourceUrl/city from KO canonical (EN inherits if absent).
 * sourceNote per-locale, EN inherits from KO if absent.
 */
function mergePair(koFront, enFront, koFilename = 'unknown.md') {
  const slug = resolveSlug(koFront, koFilename);
  const region = koFront.region; // KO canonical
  const city = koFront.city; // KO canonical
  const asOfDate = koFront.asOfDate; // KO canonical
  const sourceUrl = koFront.sourceUrl; // KO canonical

  // EN sourceNote can differ or inherit from KO
  const enSourceNote = enFront.sourceNote ?? koFront.sourceNote;

  // Merge places: add id to each place as "${slug}#${index}"
  const mergePlaces = (places) =>
    places.map((place, index) => ({
      ...place,
      id: `${slug}#${index}`,
    }));

  return {
    slug,
    region,
    city,
    asOfDate,
    sourceUrl,
    ko: {
      title: koFront.title,
      sourceNote: koFront.sourceNote,
      places: mergePlaces(koFront.places),
    },
    en: {
      title: enFront.title,
      sourceNote: enSourceNote,
      places: mergePlaces(enFront.places),
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 * EN can inherit region/asOfDate/sourceUrl from KO if not specified.
 */
function validatePair(koFilename, koFront, enFront) {
  const errors = [];

  const koResult = PlaceListFileFrontSchema.safeParse(koFront);
  const enResult = PlaceListFileEnFrontSchema.safeParse(enFront);

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
    return { placeList: null, errors };
  }

  const ko = koResult.data;
  let en = enResult.data;

  // Apply canonical rules: EN inherits region/asOfDate/sourceUrl/city from KO if not specified
  if (!en.region) {
    en.region = ko.region;
  } else if (en.region !== ko.region) {
    errors.push(
      `${koFilename}: EN region must match KO if specified (KO="${ko.region}", EN="${en.region}")`
    );
  }

  if (!en.asOfDate) {
    en.asOfDate = ko.asOfDate;
  } else if (en.asOfDate !== ko.asOfDate) {
    errors.push(
      `${koFilename}: EN asOfDate must match KO if specified (KO="${ko.asOfDate}", EN="${en.asOfDate}")`
    );
  }

  if (!en.sourceUrl && ko.sourceUrl) {
    en.sourceUrl = ko.sourceUrl;
  } else if (en.sourceUrl && en.sourceUrl !== ko.sourceUrl) {
    errors.push(
      `${koFilename}: EN sourceUrl must match KO if specified`
    );
  }

  if (!en.city && ko.city) {
    en.city = ko.city;
  }

  // Check ko/en places array length match
  if (ko.places.length !== en.places.length) {
    errors.push(
      `${koFilename}: KO places (${ko.places.length}) and EN places (${en.places.length}) must have same length`
    );
  }

  if (errors.length > 0) {
    return { placeList: null, errors };
  }

  const placeList = mergePair(ko, en, koFilename);

  return { placeList, errors };
}

/**
 * Main generator function.
 */
async function generateRestaurantMap() {
  const cwd = process.cwd();
  const contentDir = join(cwd, 'content/restaurant-map');
  const outputDir = join(cwd, 'src/components/tools/restaurant-map/data');
  const outputPath = join(outputDir, 'restaurant-map.generated.json');

  const allErrors = [];
  let files;

  // 1. Scan and list files
  try {
    files = readdirSync(contentDir).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md'
    );
  } catch (err) {
    console.error(`Error reading content directory: ${err.message}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.warn('No markdown files found in content/restaurant-map/');
  }

  // 2. Group into ko/en pairs
  const pairs = new Map();
  files.forEach((file) => {
    try {
      const content = readFileSync(join(contentDir, file), 'utf8');
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
  const placeLists = [];
  pairs.forEach(({ ko, en }, base) => {
    if (!ko || !en) {
      allErrors.push(
        `${base}: missing ${!ko ? 'Korean' : 'English'} file`
      );
      return;
    }

    const { placeList, errors } = validatePair(base, ko.data, en.data);
    if (errors.length > 0) {
      allErrors.push(...errors);
    }

    if (placeList) {
      placeLists.push(placeList);
    }
  });

  // 4. Validate uniqueness per region
  const slugSet = new Map(); // region -> Set<slug>
  placeLists.forEach((placeList) => {
    if (!slugSet.has(placeList.region)) {
      slugSet.set(placeList.region, new Set());
    }
    const regionSlugs = slugSet.get(placeList.region);
    if (regionSlugs.has(placeList.slug)) {
      allErrors.push(
        `Duplicate slug "${placeList.slug}" in region "${placeList.region}"`
      );
    } else {
      regionSlugs.add(placeList.slug);
    }
  });

  // 5. Final validation: each placeList passes MergedPlaceListSchema
  placeLists.forEach((placeList) => {
    const result = MergedPlaceListSchema.safeParse(placeList);
    if (!result.success) {
      allErrors.push(
        `${placeList.slug}: final validation error — ${result.error.message}`
      );
    }
  });

  // 6. Exit if errors
  if (allErrors.length > 0) {
    console.error('Build errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  // 7. Sort: region order → asOfDate desc → title ko locale
  const REGION_ORDER = [
    'seoul',
    'busan',
    'daegu',
    'daejeon',
    'gwangju',
    'ulsan',
    'gyeonggi',
    'gangwon',
    'chungbuk',
    'chungnam',
    'jeonbuk',
    'jeonnam',
    'gyeongbuk',
    'gyeongnam',
    'jeju',
    'nationwide',
  ];

  placeLists.sort((a, b) => {
    const regionIdxA = REGION_ORDER.indexOf(a.region);
    const regionIdxB = REGION_ORDER.indexOf(b.region);
    if (regionIdxA !== regionIdxB) {
      return regionIdxA - regionIdxB;
    }
    // asOfDate descending (newer first)
    if (a.asOfDate !== b.asOfDate) {
      return b.asOfDate.localeCompare(a.asOfDate);
    }
    // title ascending (ko locale)
    return a.ko.title.localeCompare(b.ko.title, 'ko');
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
      JSON.stringify(placeLists, null, 2),
      'utf8'
    );
    console.log(
      `✓ Generated ${placeLists.length} place lists (${placeLists.reduce((sum, p) => sum + p.ko.places.length, 0)} places total) → ${outputPath}`
    );
  } catch (err) {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  }
}

generateRestaurantMap().catch((err) => {
  console.error('Generator error:', err);
  process.exit(1);
});
