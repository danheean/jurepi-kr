import { describe, it, expect } from 'vitest';
import { replaceWithSpans, expandTemplate } from './replace-with-spans';

describe('replaceWithSpans', () => {
  it('records output spans and edits for each literal replacement', () => {
    // "a cat and a cat" → replace "cat" with "dog"
    const res = replaceWithSpans('a cat and a cat', /cat/g, () => 'dog');
    expect(res.text).toBe('a dog and a dog');
    expect(res.count).toBe(2);
    // spans point at "dog" occurrences in the OUTPUT
    expect(res.spans).toEqual([
      { index: 2, length: 3 },
      { index: 12, length: 3 },
    ]);
    // edits map input match → output slice
    expect(res.edits).toEqual([
      { inStart: 2, inLen: 3, outStart: 2, outLen: 3 },
      { inStart: 12, inLen: 3, outStart: 12, outLen: 3 },
    ]);
  });

  it('handles replacements that change length (spans track output positions)', () => {
    const res = replaceWithSpans('xx', /x/g, () => 'YYY');
    expect(res.text).toBe('YYYYYY');
    expect(res.spans).toEqual([
      { index: 0, length: 3 },
      { index: 3, length: 3 },
    ]);
    expect(res.edits[1]).toEqual({ inStart: 1, inLen: 1, outStart: 3, outLen: 3 });
  });

  it('returns no spans/edits and unchanged text when nothing matches', () => {
    const res = replaceWithSpans('hello', /zzz/g, () => '!');
    expect(res.text).toBe('hello');
    expect(res.count).toBe(0);
    expect(res.spans).toEqual([]);
    expect(res.edits).toEqual([]);
  });

  it('passes a match array with numbered captures to computeReplacement', () => {
    const seen: string[][] = [];
    replaceWithSpans('2024-07-25', /(\d{4})-(\d{2})-(\d{2})/g, (m) => {
      seen.push([m[0], m[1], m[2], m[3]]);
      return `${m[3]}/${m[2]}/${m[1]}`;
    });
    expect(seen).toEqual([['2024-07-25', '2024', '07', '25']]);
  });

  it('exposes named groups and offset on the match array', () => {
    const offsets: number[] = [];
    const res = replaceWithSpans('ab cd', /(?<pair>\w\w)/g, (m) => {
      offsets.push(m.index ?? -1);
      return (m.groups?.pair ?? '').toUpperCase();
    });
    expect(res.text).toBe('AB CD');
    expect(offsets).toEqual([0, 3]);
  });
});

describe('expandTemplate', () => {
  const matchOf = (re: RegExp, input: string): RegExpMatchArray => {
    const m = re.exec(input);
    if (!m) throw new Error('no match');
    return m;
  };

  it('expands numbered groups $1..$n', () => {
    const m = matchOf(/(\w+)@(\w+)/, 'user@host');
    expect(expandTemplate('$2:$1', m)).toBe('host:user');
  });

  it('expands the whole match $&', () => {
    const m = matchOf(/\d+/, 'id-42-x');
    expect(expandTemplate('[$&]', m)).toBe('[42]');
  });

  it('escapes a literal dollar with $$', () => {
    const m = matchOf(/x/, 'x');
    expect(expandTemplate('$$1 costs $$', m)).toBe('$1 costs $');
  });

  it('expands named groups $<name> and yields empty for unknown names', () => {
    const m = matchOf(/(?<y>\d{4})-(?<mo>\d{2})/, '2024-07');
    expect(expandTemplate('$<mo>/$<y>', m)).toBe('07/2024');
    expect(expandTemplate('$<nope>', m)).toBe('');
  });

  it('expands the prefix and suffix tokens', () => {
    const m = matchOf(/mid/, 'pre-mid-post');
    expect(expandTemplate('$`', m)).toBe('pre-'); // $` = text before match
    expect(expandTemplate("$'", m)).toBe('-post'); // $' = text after match
  });

  it('prefers a two-digit group when it exists, else splits one-digit + literal', () => {
    // 11 capture groups so $11 is a real reference
    const re = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)/;
    const m = matchOf(re, 'abcdefghijk');
    expect(expandTemplate('$11', m)).toBe('k'); // two-digit group 11
    // Only 2 groups: $12 → group 1 ("a") + literal "2"
    const m2 = matchOf(/(a)(b)/, 'ab');
    expect(expandTemplate('$12', m2)).toBe('a2');
  });

  it('leaves an out-of-range numbered token untouched', () => {
    const m = matchOf(/(a)/, 'a');
    expect(expandTemplate('$9', m)).toBe('$9');
  });
});
