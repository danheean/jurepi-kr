/**
 * Guard against the "missing Tailwind utility renders nothing" failure mode.
 *
 * Tailwind v4 silently drops unknown utilities — `text-semantic-danger` (no such
 * color), `font-button` (no such fontFamily), `text-headline` (no such fontSize) —
 * so the element gets no style and the bug is invisible to role/presence tests.
 * This scans src/ for color, font-family/weight, and font-size utility classes
 * whose token is NOT defined in tailwind.config.ts (nor a Tailwind default) and
 * exits non-zero with the offenders.
 *
 * Run: `node scripts/validate-color-tokens.mjs`  (also enforced by a Vitest test)
 */
import { readFileSync, globSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Parse the top-level keys of a `name: { ... }` block in the Tailwind config. */
function parseBlockKeys(cfg, name) {
  const m = cfg.match(new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
  if (!m) return new Set();
  return new Set([...m[1].matchAll(/^\s*'?([a-z0-9-]+)'?\s*:/gim)].map((x) => x[1]));
}

/**
 * @returns {{violations: Array<{file:string,line:number,cls:string,token:string,kind:string}>, scanned: number}}
 */
export function collectViolations() {
  const cfg = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');
  const colorKeys = parseBlockKeys(cfg, 'colors');
  const familyKeys = parseBlockKeys(cfg, 'fontFamily');
  const sizeKeys = parseBlockKeys(cfg, 'fontSize');

  // Defined CSS custom properties, for inline `var(--token)` validation.
  // A missing custom property renders transparent/no-op (e.g. the restaurant-map
  // marker's phantom `var(--accent)`), and no Tailwind *class* scan catches it —
  // this closes that blind spot.
  const definedCssVars = new Set();
  for (const cssRel of globSync('src/**/*.css', { cwd: ROOT })) {
    const css = readFileSync(join(ROOT, cssRel), 'utf8');
    for (const mm of css.matchAll(/(?:^|[^\w-])(--[a-z0-9-]+)\s*:/gim)) definedCssVars.add(mm[1]);
  }
  const cssVarRe = /var\(\s*(--[a-z0-9-]+)/g;

  // Tailwind defaults available because we `extend` (not replace) the theme.
  const KEYWORDS = ['white', 'black', 'transparent', 'current', 'inherit'];
  const PALETTE = [
    'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
    'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
    'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  ];
  const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const validColors = new Set([...colorKeys, ...KEYWORDS]);
  for (const c of PALETTE) for (const s of SHADES) validColors.add(`${c}-${s}`);

  const validFamilies = new Set([...familyKeys, 'sans', 'serif', 'mono']);
  const WEIGHTS = new Set([
    'thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black',
  ]);
  const DEFAULT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
  const validSizes = new Set([...sizeKeys, ...DEFAULT_SIZES]);
  // text-* utilities that are alignment / wrapping / overflow, not sizes or colors.
  const TEXT_NONSIZE = new Set([
    'left', 'center', 'right', 'justify', 'start', 'end',
    'wrap', 'nowrap', 'balance', 'pretty', 'clip', 'ellipsis',
  ]);

  // First segment that signals a brand-color family (real + known-bad). Filters
  // out non-color utilities (text-sm, border-2, ring-offset-2 …).
  const COLOR_FAMILY_FIRST = new Set([
    'brand', 'on', 'surface', 'hairline', 'text', 'accent',
    'success', 'warning', 'danger', 'info', 'semantic', 'focus',
  ]);
  const COLOR_PREFIXES = [
    'text', 'bg', 'border', 'ring', 'fill', 'stroke', 'from', 'to', 'via',
    'divide', 'outline', 'decoration', 'placeholder', 'caret', 'accent',
  ];
  const VARIANT = '(?:[a-z-]+:)*'; // hover:, focus-visible:, group-hover:, md:, before: …
  const colorRe = new RegExp(
    `(?<![\\w-])${VARIANT}(${COLOR_PREFIXES.join('|')})-([a-z][a-z0-9-]*(?:/\\d+)?(?:\\[[^\\]]*\\])?)`,
    'g'
  );
  const fontRe = new RegExp(`(?<![\\w-])${VARIANT}font-([a-z][a-z0-9-]*(?:\\[[^\\]]*\\])?)`, 'g');
  const textRe = new RegExp(`(?<![\\w-])${VARIANT}text-([a-z][a-z0-9-]*(?:/\\d+)?(?:\\[[^\\]]*\\])?)`, 'g');

  // A token followed by '=' or ':' is an SVG/HTML attribute or CSS property
  // (font-size="…", text-anchor="middle", font-size: …), not a Tailwind class.
  const isAttr = (line, m) => {
    const after = line[m.index + m[0].length] || '';
    return after === '=' || after === ':';
  };

  const files = globSync('src/**/*.{ts,tsx}', { cwd: ROOT }).filter((f) => !f.includes('.test.'));
  const violations = [];
  for (const rel of files) {
    // Blank out comments (preserving line count) so prose mentioning class names
    // — e.g. "Inactive: surface-muted bg + text-secondary." — isn't scanned.
    let content = readFileSync(join(ROOT, rel), 'utf8');
    content = content.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    content = content.replace(/(^|[^:\w])\/\/[^\n]*/gm, (c, p1) => p1 + ' '.repeat(c.length - p1.length));
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      const push = (cls, token, kind) => violations.push({ file: rel, line: i + 1, cls, token, kind });
      let m;

      // 1) color utilities
      colorRe.lastIndex = 0;
      while ((m = colorRe.exec(line))) {
        const token = m[2].replace(/\/\d+$/, '');
        if (token.startsWith('[') || token.endsWith('-')) continue; // arbitrary / dynamic
        if (isAttr(line, m)) continue;
        if (!COLOR_FAMILY_FIRST.has(token.split('-')[0])) continue; // not a color family
        if (validColors.has(token)) continue;
        push(`${m[1]}-${m[2]}`, token, 'color');
      }

      // 2) font-family / font-weight
      fontRe.lastIndex = 0;
      while ((m = fontRe.exec(line))) {
        const token = m[1];
        if (token.startsWith('[') || token.endsWith('-') || /^\d/.test(token)) continue;
        if (isAttr(line, m)) continue;
        if (validFamilies.has(token) || WEIGHTS.has(token)) continue;
        push(`font-${m[1]}`, token, 'font-family/weight');
      }

      // 3) font-size (text-* that is neither a color nor an alignment/wrap utility)
      textRe.lastIndex = 0;
      while ((m = textRe.exec(line))) {
        const token = m[1].replace(/\/\d+$/, '');
        if (token.startsWith('[') || token.endsWith('-')) continue;
        if (isAttr(line, m)) continue;
        if (validColors.has(token)) continue; // color use, validated above
        if (COLOR_FAMILY_FIRST.has(token.split('-')[0])) continue; // color family (e.g. text-accent-*)
        if (TEXT_NONSIZE.has(token)) continue; // alignment / wrap
        if (validSizes.has(token)) continue;
        push(`text-${m[1]}`, token, 'font-size');
      }

      // 4) inline CSS variable references — `var(--token)` in style={{}} / SVG.
      // A missing custom property renders transparent, invisible to unit/E2E.
      cssVarRe.lastIndex = 0;
      while ((m = cssVarRe.exec(line))) {
        const token = m[1];
        // Dynamic references can't be resolved statically:
        //  `var(--accent-${c})` captures `--accent-` (trailing dash);
        //  `var(--foo${c})` is immediately followed by `$` / backtick.
        const after = line[m.index + m[0].length] || '';
        if (token.endsWith('-') || after === '$' || after === '`') continue;
        if (definedCssVars.has(token)) continue;
        push(`var(${token})`, token, 'css-var');
      }
    });
  }
  return { violations, scanned: files.length };
}

// CLI entry — `node scripts/validate-color-tokens.mjs`
if (process.argv[1] && process.argv[1].endsWith('validate-color-tokens.mjs')) {
  const { violations, scanned } = collectViolations();
  if (violations.length) {
    console.error(`\n✖ ${violations.length} invalid utility class(es) — these render NO style:\n`);
    for (const v of violations) {
      const where = v.kind === 'css-var' ? 'not defined in any src/**/*.css' : 'not in tailwind.config.ts';
      console.error(`  ${v.file}:${v.line}  ${v.cls}   (${v.kind} "${v.token}" ${where})`);
    }
    console.error('\nFix: use a real token, or add it to tokens.css + tailwind.config.ts.\n');
    process.exit(1);
  }
  console.log(`✓ All color/font utility classes resolve to real tokens (${scanned} files scanned).`);
}
