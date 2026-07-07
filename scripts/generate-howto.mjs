import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../content/howto/guides');
const OUTPUT_FILE = join(__dirname, '../src/components/tools/howto/data/guides.generated.json');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function resolveSlug(frontmatter, filename) {
  if (frontmatter.slug) {
    return frontmatter.slug;
  }
  const base = filename.replace(/_en$/, '').replace(/\.md$/, '');
  return slugify(base);
}

// Main execution
try {
  if (!existsSync(CONTENT_DIR)) {
    console.log('Content directory does not exist yet, creating empty catalog...');
    writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    process.exit(0);
  }

  const files = readdirSync(CONTENT_DIR).sort();
  const pairs = {};
  const errors = [];

  // Group into ko/en pairs
  files.forEach((file) => {
    if (file.startsWith('_') || !file.endsWith('.md')) return;

    const base = file.replace(/_en\.md$/, '.md').replace(/\.md$/, '');
    if (!pairs[base]) {
      pairs[base] = { ko: null, en: null };
    }

    if (file.includes('_en')) {
      pairs[base].en = file;
    } else {
      pairs[base].ko = file;
    }
  });

  const catalog = [];
  const slugSet = new Set();

  Object.entries(pairs).forEach(([base, { ko: koFile, en: enFile }]) => {
    if (!koFile || !enFile) {
      errors.push({
        file: koFile || enFile,
        reason: 'Missing pair (must have both .md and _en.md)',
      });
      return;
    }

    try {
      const koPath = join(CONTENT_DIR, koFile);
      const enPath = join(CONTENT_DIR, enFile);

      const koContent = readFileSync(koPath, 'utf-8');
      const enContent = readFileSync(enPath, 'utf-8');

      const koMatter = matter(koContent);
      const enMatter = matter(enContent);

      const koFront = koMatter.data;
      const koBody = koMatter.content.trim();
      const enFront = enMatter.data;
      const enBody = enMatter.content.trim();

      // Validate required fields
      if (!koFront.title) {
        errors.push({ file: koFile, reason: 'Missing required field: title' });
        return;
      }
      if (!koFront.summary) {
        errors.push({ file: koFile, reason: 'Missing required field: summary' });
        return;
      }
      if (!koBody) {
        errors.push({ file: koFile, reason: 'Body is empty' });
        return;
      }
      if (!enFront.title) {
        errors.push({ file: enFile, reason: 'Missing required field: title' });
        return;
      }
      if (!enFront.summary) {
        errors.push({ file: enFile, reason: 'Missing required field: summary' });
        return;
      }
      if (!enBody) {
        errors.push({ file: enFile, reason: 'Body is empty' });
        return;
      }

      // Resolve canonical slug from Korean file
      const slug = resolveSlug(koFront, koFile);

      if (slugSet.has(slug)) {
        errors.push({ file: koFile, reason: `Duplicate slug: ${slug}` });
        return;
      }
      slugSet.add(slug);

      // Canonical rule: metadata from Korean file
      const topic = koFront.topic || 'setup';
      const tags = koFront.tags || [];
      const order = koFront.order ?? 999;
      const updated = koFront.updated;
      const difficulty = koFront.difficulty;
      const coverImage = koFront.coverImage;
      const related = koFront.related || [];

      // Check EN doesn't contradict
      if (enFront.topic && enFront.topic !== topic) {
        errors.push({
          file: enFile,
          reason: `topic must match Korean file (${topic})`,
        });
        return;
      }

      catalog.push({
        slug,
        topic,
        tags,
        order,
        updated,
        difficulty,
        coverImage,
        related,
        ko: {
          title: koFront.title,
          summary: koFront.summary,
          body: koBody,
        },
        en: {
          title: enFront.title,
          summary: enFront.summary,
          body: enBody,
        },
      });
    } catch (e) {
      errors.push({ file: koFile || enFile, reason: e.message });
    }
  });

  // Validate related references
  const slugSet2 = new Set(catalog.map((g) => g.slug));
  catalog.forEach((guide) => {
    guide.related.forEach((relSlug) => {
      if (!slugSet2.has(relSlug)) {
        errors.push({
          file: `${guide.slug}.md`,
          reason: `Related guide not found: ${relSlug}`,
        });
      }
    });
  });

  if (errors.length > 0) {
    console.error('Generator validation errors:');
    errors.forEach((e) => {
      console.error(`  ${e.file}: ${e.reason}`);
    });
    process.exit(1);
  }

  // Sort by topic order, then order, then updated desc, then title
  const topicOrder = {
    setup: 1,
    'ai-tools': 2,
    git: 3,
    api: 4,
    cli: 5,
    deploy: 6,
  };

  catalog.sort((a, b) => {
    const topicCmp = (topicOrder[a.topic] || 999) - (topicOrder[b.topic] || 999);
    if (topicCmp !== 0) return topicCmp;

    const orderCmp = a.order - b.order;
    if (orderCmp !== 0) return orderCmp;

    const updatedCmp = (b.updated || '').localeCompare(a.updated || '');
    if (updatedCmp !== 0) return updatedCmp;

    return a.ko.title.localeCompare(b.ko.title);
  });

  writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Generated ${catalog.length} guides to ${OUTPUT_FILE}`);
} catch (e) {
  console.error('Generator error:', e.message);
  process.exit(1);
}
