#!/usr/bin/env node

/**
 * Build-time generator for the "birthday-secret" (나의 탄생 비밀) tool.
 *
 * Reads:
 *   content/birthday-secret/stones.json   (12 monthly stones, ko/en)
 *   content/birthday-secret/flowers.json  (366 daily flowers, ko/en; meaning may be "")
 *   content/birthday-secret/months/<slug>.md + <slug>_en.md  (12 spoke long-form bodies)
 * Computes:
 *   366 daily "birth colors" — deterministic Jurepi 생일색 spectrum (golden-angle hue).
 * Validates everything (fails build with a clear message on any violation).
 * Emits:
 *   src/components/tools/birthday-secret/data/birthday-secret.generated.json
 *
 * Deterministic: no Date/random. exit 0 on success, 1 on any validation failure.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'content', 'birthday-secret');
const OUT_DIR = join(ROOT, 'src', 'components', 'tools', 'birthday-secret', 'data');
const OUT_FILE = join(OUT_DIR, 'birthday-secret.generated.json');

const MONTH_SLUGS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Feb = 29 (allow 02-29 birthdays)
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const errors = [];
const fail = (msg) => errors.push(msg);
const pad2 = (n) => String(n).padStart(2, '0');

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`Cannot read/parse ${file}: ${e.message}`);
    return null;
  }
}

/** Every "MM-DD" key of the (leap-inclusive) year, in calendar order. */
function allDayKeys() {
  const keys = [];
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= DAYS_IN_MONTH[m - 1]; d++) keys.push(`${pad2(m)}-${pad2(d)}`);
  }
  return keys; // 366
}

// ── Schemas (validation) ──────────────────────────────────────────────
const LocalizedStone = z.object({
  name: z.string().min(1),
  meaning: z.string().min(10),
  color: z.string().min(1),
  hardness: z.string().min(1),
  origin: z.string().min(1),
});
const StoneSchema = z.object({
  month: z.number().int().min(1).max(12),
  ko: LocalizedStone,
  en: LocalizedStone,
  googleQuery: z.object({ ko: z.string().min(1), en: z.string().min(1) }),
});
const FlowerSchema = z.object({
  key: z.string().regex(/^\d{2}-\d{2}$/),
  ko: z.object({ name: z.string().min(1), meaning: z.string() }),
  en: z.object({ name: z.string().min(1), meaning: z.string() }),
  googleQuery: z.object({ ko: z.string().min(1), en: z.string().min(1) }),
});

// ── Color spectrum (Jurepi 생일색): deterministic, golden-angle hue ────
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to255 = (v) => Math.round((v + m) * 255);
  return '#' + [to255(r), to255(g), to255(b)].map((v) => pad2(v.toString(16))).join('');
}

// Hue families → localized name + keyword. Boundaries follow perceptual color
// names on the wheel (0–360°) so a color's NAME matches how it actually looks.
const FAMILIES = [
  { max: 14, ko: '레드', en: 'Red', kw: { ko: '열정', en: 'Passion' } },
  { max: 28, ko: '코랄', en: 'Coral', kw: { ko: '생기', en: 'Vitality' } },
  { max: 42, ko: '오렌지', en: 'Orange', kw: { ko: '활력', en: 'Energy' } },
  { max: 55, ko: '앰버', en: 'Amber', kw: { ko: '따뜻함', en: 'Warmth' } },
  { max: 70, ko: '옐로', en: 'Yellow', kw: { ko: '명랑', en: 'Cheer' } },
  { max: 90, ko: '라임', en: 'Lime', kw: { ko: '상쾌함', en: 'Freshness' } },
  { max: 150, ko: '그린', en: 'Green', kw: { ko: '안정', en: 'Balance' } },
  { max: 168, ko: '민트', en: 'Mint', kw: { ko: '평온', en: 'Calm' } },
  { max: 188, ko: '틸', en: 'Teal', kw: { ko: '차분함', en: 'Serenity' } },
  { max: 205, ko: '아쿠아', en: 'Aqua', kw: { ko: '맑음', en: 'Clarity' } },
  { max: 232, ko: '스카이블루', en: 'Sky Blue', kw: { ko: '자유', en: 'Freedom' } },
  { max: 255, ko: '블루', en: 'Blue', kw: { ko: '신뢰', en: 'Trust' } },
  { max: 275, ko: '인디고', en: 'Indigo', kw: { ko: '깊이', en: 'Depth' } },
  { max: 300, ko: '바이올렛', en: 'Violet', kw: { ko: '신비', en: 'Mystery' } },
  { max: 322, ko: '마젠타', en: 'Magenta', kw: { ko: '매력', en: 'Charm' } },
  { max: 342, ko: '핑크', en: 'Pink', kw: { ko: '사랑스러움', en: 'Sweetness' } },
  { max: 361, ko: '로즈', en: 'Rose', kw: { ko: '사랑', en: 'Love' } },
];
function familyFor(hue) {
  const h = ((hue % 360) + 360) % 360;
  return FAMILIES.find((f) => h < f.max) ?? FAMILIES[FAMILIES.length - 1];
}
function shadeFor(l) {
  if (l < 0.56) return { ko: '짙은 ', en: 'Deep ' };
  if (l > 0.63) return { ko: '밝은 ', en: 'Light ' };
  return { ko: '', en: '' };
}
function buildColors(keys) {
  const colors = {};
  keys.forEach((key, d) => {
    const hue = (d * 137.508) % 360;
    const s = 0.68 + 0.1 * Math.sin(d * 0.7);
    const l = 0.6 + 0.06 * Math.cos(d * 0.5);
    const hex = hslToHex(hue, s, l);
    const fam = familyFor(hue);
    const sh = shadeFor(l);
    colors[key] = {
      key,
      hex,
      ko: { name: `${sh.ko}${fam.ko}`, keyword: fam.kw.ko },
      en: { name: `${sh.en}${fam.en}`, keyword: fam.kw.en },
    };
    if (!HEX_RE.test(hex)) fail(`color ${key}: bad hex ${hex}`);
  });
  return colors;
}

// ── Load + validate content ───────────────────────────────────────────
function loadStones() {
  const raw = readJson(join(CONTENT, 'stones.json'));
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  raw.forEach((s, i) => {
    const p = StoneSchema.safeParse(s);
    if (!p.success) fail(`stones[${i}] invalid: ${p.error.issues.map((x) => x.path.join('.') + ' ' + x.message).join('; ')}`);
    else {
      if (seen.has(s.month)) fail(`stones: duplicate month ${s.month}`);
      seen.add(s.month);
    }
  });
  for (let m = 1; m <= 12; m++) if (!seen.has(m)) fail(`stones: missing month ${m}`);
  return raw.slice().sort((a, b) => a.month - b.month);
}

function loadFlowers(dayKeys) {
  const raw = readJson(join(CONTENT, 'flowers.json'));
  if (!Array.isArray(raw)) return {};
  const rec = {};
  raw.forEach((f, i) => {
    const p = FlowerSchema.safeParse(f);
    if (!p.success) {
      fail(`flowers[${i}] (${f?.key}) invalid: ${p.error.issues.map((x) => x.path.join('.') + ' ' + x.message).join('; ')}`);
      return;
    }
    if (rec[f.key]) fail(`flowers: duplicate key ${f.key}`);
    rec[f.key] = f;
  });
  dayKeys.forEach((k) => { if (!rec[k]) fail(`flowers: missing day ${k}`); });
  if (Object.keys(rec).length !== 366 && raw.length) fail(`flowers: expected 366 unique days, got ${Object.keys(rec).length}`);
  return rec;
}

function loadMonths() {
  const months = [];
  MONTH_SLUGS.forEach((slug, idx) => {
    const koFile = join(CONTENT, 'months', `${slug}.md`);
    const enFile = join(CONTENT, 'months', `${slug}_en.md`);
    if (!existsSync(koFile)) { fail(`months: missing ${slug}.md (ko)`); return; }
    if (!existsSync(enFile)) { fail(`months: missing ${slug}_en.md (en)`); return; }
    const ko = matter(readFileSync(koFile, 'utf8'));
    const en = matter(readFileSync(enFile, 'utf8'));
    const koTitle = String(ko.data.title || '').trim();
    const enTitle = String(en.data.title || '').trim();
    const koBody = ko.content.trim();
    const enBody = en.content.trim();
    if (!koTitle) fail(`months/${slug}.md: missing frontmatter title`);
    if (!enTitle) fail(`months/${slug}_en.md: missing frontmatter title`);
    if (koBody.length < 200) fail(`months/${slug}.md: body too thin (${koBody.length} chars, need ≥200)`);
    if (enBody.length < 200) fail(`months/${slug}_en.md: body too thin (${enBody.length} chars, need ≥200)`);
    months.push({ month: idx + 1, slug, ko: { title: koTitle, body: koBody }, en: { title: enTitle, body: enBody } });
  });
  return months;
}

// ── Run ───────────────────────────────────────────────────────────────
const dayKeys = allDayKeys();
if (dayKeys.length !== 366) fail(`internal: day key count ${dayKeys.length} ≠ 366`);

const stones = loadStones();
const flowers = loadFlowers(dayKeys);
const colors = buildColors(dayKeys);
const months = loadMonths();

if (errors.length) {
  console.error('\n[generate-birthday-secret] FAILED:\n' + errors.map((e) => '  ✗ ' + e).join('\n') + '\n');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const catalog = { stones, flowers, colors, months };
writeFileSync(OUT_FILE, JSON.stringify(catalog) + '\n');
console.log(`[generate-birthday-secret] OK — ${stones.length} stones, ${Object.keys(flowers).length} flowers, ${Object.keys(colors).length} colors, ${months.length} months → ${OUT_FILE.replace(ROOT + '/', '')}`);
