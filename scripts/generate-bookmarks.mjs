#!/usr/bin/env node

/**
 * Build-time generator: scan content/bookmarks/topics/, parse markdown,
 * validate, merge ko+en pairs, extract YouTube IDs, fetch OG images (with caching),
 * and emit bookmarks.generated.json.
 *
 * YouTube ID extraction logic is replicated from src/lib/bookmarks/youtube.ts.
 * See that file as the single source of truth for the extraction algorithm.
 *
 * OG image fetching uses a cache file (content/bookmarks/.og-cache.json) to avoid
 * redundant network calls and ensure deterministic builds.
 *
 * Deterministic: cache-first, exit 0 on success, 1 on any validation failure.
 * OG fetch failures are logged as warnings and cached as null (never fail the build).
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

// Re-declare schemas (keep in sync with src/lib/bookmarks/schema.ts)
const BookmarkFileFrontSchema = z.object({
  title: z.string().min(1, 'title required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1, 'description required').max(200, 'description max 200 chars'),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1, 'section heading required'),
        links: z
          .array(
            z.object({
              label: z.string().min(1, 'link label required'),
              url: z.string().url('link url must be valid http(s) URL'),
              description: z.string().max(100, 'link description max 100 chars').optional(),
              youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
              image: z.string().url().optional(),
            })
          )
          .min(1, 'section must have ≥1 link'),
      })
    )
    .min(1, 'topic must have ≥1 section'),
});

const MergedTopicSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  ko: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string(),
            description: z.string().optional(),
            youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
            image: z.string().url().optional(),
          })
        ),
      })
    ),
  }),
  en: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string(),
            description: z.string().optional(),
            youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
            image: z.string().url().optional(),
          })
        ),
      })
    ),
  }),
});

const LINKS_MIN_PER_TOPIC = 3;
const FETCH_TIMEOUT_MS = 5000;
const BATCH_SIZE = 6;

/**
 * Extract YouTube video ID from a URL (11-char format).
 * CRITICAL: This logic must remain IDENTICAL to src/lib/bookmarks/youtube.ts.
 * See that file as the source of truth.
 *
 * Supported: /watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID
 * Returns: null for channels, playlists, search, or non-embeddable URLs
 */
function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname || '';

    if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
      return null;
    }

    if (hostname.includes('youtu.be')) {
      const pathname = urlObj.pathname;
      const match = pathname.match(/^\/([A-Za-z0-9_-]{11})$/);
      return match && match[1] ? match[1] : null;
    }

    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    if (pathname === '/watch') {
      const videoId = searchParams.get('v');
      if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
      return null;
    }

    if (pathname.startsWith('/embed/')) {
      const match = pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})$/);
      return match && match[1] ? match[1] : null;
    }

    if (pathname.startsWith('/shorts/')) {
      const match = pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})$/);
      return match && match[1] ? match[1] : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch og:image from a URL, with timeout and retry-free best-effort logic.
 * Returns null if fetch fails, timeout, or no og:image found.
 */
async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const ogImageMatch = html.match(
      /<meta\s+(?:property="og:image"|name="og:image"|property="twitter:image"|name="twitter:image")\s+content="([^"]+)"/i
    );

    if (!ogImageMatch || !ogImageMatch[1]) {
      return null;
    }

    let imageUrl = ogImageMatch[1];

    // Resolve relative URLs to absolute
    if (imageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      imageUrl = `${urlObj.protocol}//${urlObj.hostname}${imageUrl}`;
    } else if (!imageUrl.startsWith('http')) {
      const urlObj = new URL(url);
      imageUrl = new URL(imageUrl, `${urlObj.protocol}//${urlObj.hostname}`).href;
    }

    return imageUrl;
  } catch (err) {
    return null;
  }
}

/**
 * Load OG cache from disk (or empty object if missing).
 */
function loadOgCache(cachePath) {
  if (existsSync(cachePath)) {
    try {
      const content = readFileSync(cachePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Save OG cache to disk (sorted keys, deterministic).
 */
function saveOgCache(cachePath, cache) {
  const sorted = Object.keys(cache)
    .sort()
    .reduce((acc, key) => {
      acc[key] = cache[key];
      return acc;
    }, {});
  writeFileSync(cachePath, JSON.stringify(sorted, null, 2), 'utf-8');
}

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
 * Enrich a single link: bake youtubeId if video, or og:image (from cache or fetched).
 * The link is enriched in-place (mutation) and returned for chaining.
 */
function enrichLink(link, ogCache) {
  // Try to extract YouTube video ID
  const youtubeId = extractYoutubeId(link.url);
  if (youtubeId) {
    link.youtubeId = youtubeId;
    // Don't fetch OG image for videos; derive thumbnail from ID at render time
    return link;
  }

  // For non-video links, check/fetch OG image from cache
  if (ogCache[link.url] !== undefined) {
    // Cache hit (could be null if fetch previously failed)
    if (ogCache[link.url]) {
      link.image = ogCache[link.url];
    }
  }
  // If not in cache yet, we'll fetch it in a batch later
  // Mark it as needing fetch with a sentinel value
  else {
    link._needsOgFetch = true;
  }

  return link;
}

/**
 * Merge ko + en pair following canonical rule.
 * Slug is canonical from KO; title/description/sections are per-locale.
 */
function mergePair(koFront, enFront, koFilename = 'unknown.md') {
  const slug = resolveSlug(koFront, koFilename);

  return {
    slug,
    ko: {
      title: koFront.title,
      description: koFront.description,
      sections: koFront.sections,
    },
    en: {
      title: enFront.title,
      description: enFront.description,
      sections: enFront.sections,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 */
function validatePair(koFilename, koFront, enFront) {
  const errors = [];

  const koResult = BookmarkFileFrontSchema.safeParse(koFront);
  const enResult = BookmarkFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { topic: null, errors };
  }

  const ko = koResult.data;
  const en = enResult.data;

  // Validate ko/en link counts (≥3 links total per topic per locale)
  const koLinkCount = ko.sections.reduce((acc, sec) => acc + sec.links.length, 0);
  const enLinkCount = en.sections.reduce((acc, sec) => acc + sec.links.length, 0);

  if (koLinkCount < LINKS_MIN_PER_TOPIC) {
    errors.push(`${koFilename}: KO has ${koLinkCount} links, need ≥${LINKS_MIN_PER_TOPIC}`);
  }
  if (enLinkCount < LINKS_MIN_PER_TOPIC) {
    errors.push(`${koFilename}: EN has ${enLinkCount} links, need ≥${LINKS_MIN_PER_TOPIC}`);
  }

  if (errors.length > 0) {
    return { topic: null, errors };
  }

  const topic = mergePair(ko, en, koFilename);

  return { topic, errors: [] };
}

/**
 * Batch fetch OG images for links that need them, respecting the cache.
 * Updates ogCache in-place and cleans up _needsOgFetch sentinel.
 */
async function fetchMissingOgImages(topics, ogCache) {
  const urlsToFetch = [];
  const urlToLinksMap = new Map();

  // Collect all URLs that need OG fetch
  topics.forEach((topic) => {
    ['ko', 'en'].forEach((locale) => {
      topic[locale].sections.forEach((section) => {
        section.links.forEach((link) => {
          if (link._needsOgFetch) {
            if (!urlsToFetch.includes(link.url)) {
              urlsToFetch.push(link.url);
            }
            if (!urlToLinksMap.has(link.url)) {
              urlToLinksMap.set(link.url, []);
            }
            urlToLinksMap.get(link.url).push(link);
          }
        });
      });
    });
  });

  if (urlsToFetch.length === 0) {
    return; // All URLs cached
  }

  console.log(`Fetching OG images for ${urlsToFetch.length} unique URL(s)...`);

  // Batch fetch with rate limiting (BATCH_SIZE at a time)
  for (let i = 0; i < urlsToFetch.length; i += BATCH_SIZE) {
    const batch = urlsToFetch.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const image = await fetchOgImage(url);
        return { url, image };
      })
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { url, image } = result.value;
        ogCache[url] = image; // Cache (could be null)

        // Apply to all links with this URL
        const links = urlToLinksMap.get(url) || [];
        links.forEach((link) => {
          if (image) {
            link.image = image;
          }
          delete link._needsOgFetch;
        });
      } else {
        // Fetch promise rejected; treat as failed fetch
        const url = batch[results.indexOf(result)];
        if (url) {
          ogCache[url] = null;
          const links = urlToLinksMap.get(url) || [];
          links.forEach((link) => {
            delete link._needsOgFetch;
          });
        }
      }
    });
  }
}

/**
 * Main generator: scan, parse, validate, merge, enrich (YouTube IDs + OG images), emit.
 */
async function main() {
  const contentDir = new URL('../content/bookmarks/topics/', import.meta.url).pathname;
  const outputDir = new URL('../src/components/tools/bookmarks/data/', import.meta.url).pathname;
  const outputFile = join(outputDir, 'bookmarks.generated.json');
  const cacheDir = new URL('../content/bookmarks/', import.meta.url).pathname;
  const cacheFile = join(cacheDir, '.og-cache.json');

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  // Load OG cache
  const ogCache = loadOgCache(cacheFile);
  console.log(`Loaded OG cache with ${Object.keys(ogCache).length} entries`);

  console.log(`Scanning ${contentDir}...`);

  let files;
  try {
    files = readdirSync(contentDir, { encoding: 'utf-8' });
  } catch (err) {
    console.error(`Failed to read ${contentDir}:`, err.message);
    console.error('Creating empty content directory...');
    mkdirSync(contentDir, { recursive: true });
    files = [];
  }

  // Filter: exclude files starting with '_' (templates)
  files = files.filter((f) => !f.startsWith('_') && f.endsWith('.md'));

  if (files.length === 0) {
    console.warn('No markdown files found. Emitting empty catalog.');
    writeFileSync(outputFile, JSON.stringify([], null, 2), 'utf-8');
    console.log(`Wrote ${outputFile}`);
    process.exit(0);
  }

  // Group by base filename (ko/en pairs)
  const pairs = new Map();
  files.forEach((file) => {
    const base = file.replace(/(_en)?\.md$/, '');
    const isEn = file.endsWith('_en.md');
    if (!pairs.has(base)) {
      pairs.set(base, {});
    }
    pairs.get(base)[isEn ? 'en' : 'ko'] = file;
  });

  const topics = [];
  const allErrors = [];

  // Validate each pair
  for (const [base, pair] of pairs) {
    if (!pair.ko) {
      allErrors.push(`${base}: missing Korean file (.md)`);
      continue;
    }
    if (!pair.en) {
      allErrors.push(`${base}: missing English file (_en.md)`);
      continue;
    }

    try {
      const koPath = join(contentDir, pair.ko);
      const enPath = join(contentDir, pair.en);

      const koContent = readFileSync(koPath, 'utf-8');
      const enContent = readFileSync(enPath, 'utf-8');

      const koParsed = matter(koContent);
      const enParsed = matter(enContent);

      const { topic, errors } = validatePair(base, koParsed.data, enParsed.data);

      if (errors.length > 0) {
        allErrors.push(...errors);
      }

      if (topic) {
        topics.push(topic);
      }
    } catch (err) {
      allErrors.push(`${base}: read/parse error — ${err.message}`);
    }
  }

  // Check for duplicate slugs
  const slugSet = new Set();
  topics.forEach((topic) => {
    if (slugSet.has(topic.slug)) {
      allErrors.push(`Duplicate slug: "${topic.slug}"`);
    }
    slugSet.add(topic.slug);
  });

  // Validate final merged topics
  topics.forEach((topic) => {
    const result = MergedTopicSchema.safeParse(topic);
    if (!result.success) {
      allErrors.push(`${topic.slug}: merged schema error — ${result.error.message}`);
    }
  });

  // Report errors
  if (allErrors.length > 0) {
    console.error('\nValidation errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    console.error(`\n${allErrors.length} error(s) found. Build failed.`);
    process.exit(1);
  }

  // ENRICH: bake youtubeId and og:image for all links
  console.log('Enriching links with YouTube IDs and OpenGraph metadata...');
  topics.forEach((topic) => {
    ['ko', 'en'].forEach((locale) => {
      topic[locale].sections.forEach((section) => {
        section.links.forEach((link) => {
          enrichLink(link, ogCache);
        });
      });
    });
  });

  // Fetch missing OG images (batched, with timeout)
  await fetchMissingOgImages(topics, ogCache);

  // Save OG cache (deterministic, sorted)
  saveOgCache(cacheFile, ogCache);
  console.log(`Cached OG data to ${cacheFile}`);

  // Sort topics by slug (deterministic)
  topics.sort((a, b) => a.slug.localeCompare(b.slug));

  // Write output
  writeFileSync(outputFile, JSON.stringify(topics, null, 2), 'utf-8');
  console.log(`\nSuccess! Emitted ${topics.length} topic(s) to ${outputFile}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
