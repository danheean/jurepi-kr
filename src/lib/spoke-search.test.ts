import { describe, it, expect } from 'vitest';
import { matchSpoke, filterSpokes, SPOKE_RESULT_LIMIT } from './tool-search';
import type { SearchableSpoke } from './tool-search';

const spoke = (over: Partial<SearchableSpoke> = {}): SearchableSpoke => ({
  tool: 'new-word',
  slug: 'x',
  name: 'Vibe Coding',
  description: 'coding with vibes',
  keywords: ['바이브코딩'],
  parentToolName: 'New Word',
  accent: 'mint',
  icon: 'BookA',
  ...over,
});

describe('matchSpoke', () => {
  it('returns false for an empty/whitespace query (spokes only surface with a query)', () => {
    expect(matchSpoke(spoke(), '')).toBe(false);
    expect(matchSpoke(spoke(), '   ')).toBe(false);
  });

  it('matches name case-insensitively', () => {
    expect(matchSpoke(spoke({ name: 'Alan Turing' }), 'turing')).toBe(true);
    expect(matchSpoke(spoke({ name: 'Alan Turing' }), 'TURING')).toBe(true);
  });

  it('matches a description substring', () => {
    expect(
      matchSpoke(spoke({ description: 'father of computing' }), 'computing')
    ).toBe(true);
  });

  it('matches keywords (aliases)', () => {
    expect(matchSpoke(spoke({ keywords: ['고능하다'] }), '고능')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(
      matchSpoke(spoke({ name: 'a', description: 'b', keywords: [] }), 'zzz')
    ).toBe(false);
  });
});

describe('filterSpokes', () => {
  const many = Array.from({ length: 20 }, (_, i) =>
    spoke({ slug: `s${i}`, name: `Vibe ${i}`, keywords: [] })
  );

  it('returns an empty array for an empty query', () => {
    expect(filterSpokes(many, '')).toEqual([]);
  });

  it('caps results at SPOKE_RESULT_LIMIT', () => {
    expect(filterSpokes(many, 'vibe')).toHaveLength(SPOKE_RESULT_LIMIT);
  });

  it('respects a custom limit', () => {
    expect(filterSpokes(many, 'vibe', 3)).toHaveLength(3);
  });

  it('returns only matching spokes', () => {
    const mixed = [
      spoke({ name: 'Alan Turing', description: '', keywords: [] }),
      spoke({ name: 'Ada Lovelace', description: '', keywords: [] }),
    ];
    const res = filterSpokes(mixed, 'ada');
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Ada Lovelace');
  });

  it('does not mutate the input array', () => {
    const input = [...many];
    filterSpokes(input, 'vibe');
    expect(input).toHaveLength(20);
  });
});
