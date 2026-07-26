/**
 * i18n drift guard — prevents two recurring failure modes AT BUILD TIME.
 *
 * next-intl renders a missing key as the raw key string (no throw), so both of
 * these pass `tsc` + a scoped `vitest run` + `next build` today and only surface
 * on the live site:
 *
 *  (1) ko↔en parity drift — a key added to one catalog but not the other.
 *  (2) invented keys — a component calls `t('x.y')` for a key that exists in
 *      NEITHER catalog (renders the raw key path to users / screen readers).
 *
 * This runs in `prebuild` (before `next build`, which Cloudflare runs on every
 * push), so drift fails the DEPLOY itself — detection becomes prevention.
 *
 * Opposite-language leakage (English in ko values, etc.) is intentionally NOT
 * gated here: brand names ("Jurepi"), ICU syntax (`{count, plural, ...}`) and
 * etymology (陰曆 / 干支) make it too noisy for a zero-false-positive hard gate.
 * That stays a manual review heuristic (see design-system-fidelity / jurepi-tdd).
 *
 * Namespace resolution mirrors next-intl: `useTranslations('ns')` /
 * `getTranslations({ namespace: 'ns' })` scope subsequent `t('key')` calls to
 * `ns.key`. Files whose namespace is a variable / template literal
 * (`tools.${slug}`) can't be resolved statically and are skipped (conservative —
 * a false build failure is worse than a missed check; those routes are covered
 * by prerender + E2E gates instead).
 *
 * Run: `node scripts/validate-i18n.mjs`  (also enforced by a Vitest test)
 */
import { readFileSync, globSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const KO = 'src/i18n/messages/ko.json';
const EN = 'src/i18n/messages/en.json';

/** Leaf (string/array) keys only — the set that must be identical across locales. */
function leafKeys(obj, prefix = '', set = new Set()) {
  for (const k in obj) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) leafKeys(v, key, set);
    else set.add(key);
  }
  return set;
}

/**
 * All paths including intermediate object nodes. A component may legally address
 * a subtree (e.g. `t.raw('faq')` where `faq` is an object of Q/A items), so an
 * object node is a valid `t()` target too.
 */
function allPaths(obj, prefix = '', set = new Set()) {
  for (const k in obj) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    set.add(key);
    if (v && typeof v === 'object' && !Array.isArray(v)) allPaths(v, key, set);
  }
  return set;
}

/** @returns {{koOnly:string[], enOnly:string[], koCount:number, enCount:number}} */
export function collectParityViolations() {
  const ko = JSON.parse(readFileSync(join(ROOT, KO), 'utf8'));
  const en = JSON.parse(readFileSync(join(ROOT, EN), 'utf8'));
  const koK = leafKeys(ko);
  const enK = leafKeys(en);
  return {
    koOnly: [...koK].filter((k) => !enK.has(k)),
    enOnly: [...enK].filter((k) => !koK.has(k)),
    koCount: koK.size,
    enCount: enK.size,
  };
}

/** @returns {Array<{file:string,line:number,key:string,ns:string[]}>} */
export function collectUsageViolations() {
  const ko = JSON.parse(readFileSync(join(ROOT, KO), 'utf8'));
  const en = JSON.parse(readFileSync(join(ROOT, EN), 'utf8'));
  const valid = new Set([...allPaths(ko), ...allPaths(en)]);

  const NS_CALL = /(?:useTranslations|getTranslations)\(([^)]*)\)/g;
  const IS_STR = /^['"][^'"]+['"]$/;
  const HAS_OBJ_NS = /namespace:\s*['"][^'"]+['"]/;
  const NS_STR = /(?:useTranslations|getTranslations)\(\s*['"]([^'"]+)['"]\s*\)/g;
  const NS_OBJ = /(?:useTranslations|getTranslations)\([^)]*namespace:\s*['"]([^'"]+)['"]/g;
  const T_CALL = /\bt(?:\.(?:raw|rich|markup))?\(\s*['"]([^'"`]+)['"]/g;

  const files = globSync('src/**/*.{ts,tsx}', { cwd: ROOT }).filter(
    (f) => !f.includes('.test.') && !f.includes('__test__')
  );

  const violations = [];
  for (const rel of files) {
    let content = readFileSync(join(ROOT, rel), 'utf8');
    // Blank comments (preserving line count) so keys mentioned in prose aren't scanned.
    content = content.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    content = content.replace(/(^|[^:\w])\/\/[^\n]*/gm, (c, p1) => p1 + ' '.repeat(c.length - p1.length));

    // Dynamic namespace anywhere in the file → can't resolve statically → skip.
    let dynamic = false;
    for (const m of content.matchAll(NS_CALL)) {
      const arg = m[1].trim();
      if (arg === '' || IS_STR.test(arg) || HAS_OBJ_NS.test(arg)) continue;
      dynamic = true;
    }
    if (dynamic) continue;

    const ns = [''];
    for (const m of content.matchAll(NS_STR)) ns.push(m[1]);
    for (const m of content.matchAll(NS_OBJ)) ns.push(m[1]);

    for (const m of content.matchAll(T_CALL)) {
      const key = m[1];
      if (key.includes('${') || !/[a-zA-Z]/.test(key)) continue; // dynamic / non-key
      const ok = ns.some((n) => valid.has(n ? `${n}.${key}` : key));
      if (!ok) {
        const line = content.slice(0, m.index).split('\n').length;
        violations.push({ file: rel, line, key, ns: ns.filter(Boolean) });
      }
    }
  }
  return violations;
}

// CLI entry — `node scripts/validate-i18n.mjs`
if (process.argv[1] && process.argv[1].endsWith('validate-i18n.mjs')) {
  const { koOnly, enOnly, koCount, enCount } = collectParityViolations();
  const usage = collectUsageViolations();
  let failed = false;

  if (koOnly.length || enOnly.length) {
    failed = true;
    console.error(`\n✖ ko↔en key parity drift (ko ${koCount} vs en ${enCount} leaf keys):`);
    for (const k of koOnly) console.error(`  only in ko.json: ${k}`);
    for (const k of enOnly) console.error(`  only in en.json: ${k}`);
  }

  if (usage.length) {
    failed = true;
    console.error(`\n✖ ${usage.length} t() key(s) that resolve in NEITHER catalog (render the raw key):`);
    for (const v of usage) {
      console.error(`  ${v.file}:${v.line}  t('${v.key}')  [ns: ${v.ns.join(', ') || '(root)'}]`);
    }
  }

  if (failed) {
    console.error('\nFix: correct the key, or add it to BOTH ko.json and en.json.\n');
    process.exit(1);
  }
  console.log(`✓ i18n OK — ko/en parity (${koCount} keys) and all static t() keys resolve.`);
}
