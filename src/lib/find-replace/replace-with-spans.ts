/**
 * Span/edit-aware replacement.
 *
 * Applies `regex` to `text`, building the output while recording, for each
 * replacement, its span in the OUTPUT text (for highlighting) and the underlying
 * edit (input+output positions, for remapping prior spans through this rule).
 *
 * `computeReplacement(match)` returns the replacement string for a match — for
 * literal rules that's the raw replacement; for regex rules it's the `$`-expanded
 * template. Using the native `String.replace` callback guarantees we visit exactly
 * the same matches (and in the same order) the actual replacement would.
 */
export interface Span {
  index: number;
  length: number;
}

export interface Edit {
  inStart: number;
  inLen: number;
  outStart: number;
  outLen: number;
}

export interface ReplaceResult {
  text: string;
  count: number;
  spans: Span[];
  edits: Edit[];
}

export function replaceWithSpans(
  text: string,
  regex: RegExp,
  computeReplacement: (match: RegExpMatchArray) => string
): ReplaceResult {
  const spans: Span[] = [];
  const edits: Edit[] = [];
  let out = '';
  let lastEnd = 0;
  let count = 0;

  text.replace(regex, (...args: unknown[]): string => {
    // Callback args: (matched, p1, …, pn, offset, string, groups?)
    const hasGroups =
      typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null;
    const groups = hasGroups ? (args[args.length - 1] as Record<string, string>) : undefined;
    const offset = (hasGroups ? args[args.length - 3] : args[args.length - 2]) as number;
    const matched = args[0] as string;
    const captures = args.slice(1, hasGroups ? args.length - 3 : args.length - 2) as string[];

    const matchArray = Object.assign([matched, ...captures] as string[], {
      index: offset,
      input: text,
      groups,
    }) as unknown as RegExpMatchArray;

    const replacement = computeReplacement(matchArray);

    out += text.slice(lastEnd, offset); // unchanged prefix
    const outStart = out.length;
    out += replacement;
    spans.push({ index: outStart, length: replacement.length });
    edits.push({ inStart: offset, inLen: matched.length, outStart, outLen: replacement.length });
    lastEnd = offset + matched.length;
    count++;
    return replacement;
  });

  out += text.slice(lastEnd);
  return { text: out, count, spans, edits };
}

/**
 * Expand a regex replacement template ($1, $<name>, $&, $$, $`, $') for a single
 * match, matching JavaScript `String.replace` semantics.
 */
export function expandTemplate(template: string, match: RegExpMatchArray): string {
  const input = (match as RegExpMatchArray & { input?: string }).input ?? '';
  const offset = match.index ?? 0;
  const groups = (match as RegExpMatchArray & { groups?: Record<string, string> }).groups;

  return template.replace(/\$(\$|&|`|'|<([^>]*)>|\d{1,2})/g, (whole, token: string, name?: string) => {
    if (token === '$') return '$';
    if (token === '&') return match[0];
    if (token === '`') return input.slice(0, offset);
    if (token === "'") return input.slice(offset + match[0].length);
    if (name !== undefined) return groups?.[name] ?? '';
    // Numbered group: prefer two-digit if it exists, else one-digit (JS behavior)
    const twoDigit = Number(token);
    if (token.length === 2 && match[twoDigit] !== undefined) {
      return match[twoDigit] ?? '';
    }
    const oneDigit = Number(token[0]);
    if (match[oneDigit] !== undefined) {
      const rest = token.length === 2 ? token[1] : '';
      return (match[oneDigit] ?? '') + rest;
    }
    return whole;
  });
}
