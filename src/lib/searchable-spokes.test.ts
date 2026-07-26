import { describe, it, expect } from 'vitest';
import { toSearchableSpokes } from './searchable-spokes';
import termsData from '@/components/tools/new-word/data/terms.generated.json';
import rankingsData from '@/components/tools/rankings/data/rankings.generated.json';
import bookmarksData from '@/components/tools/bookmarks/data/bookmarks.generated.json';
import devPeopleData from '@/components/tools/dev-people/data/dev-people.generated.json';
import guidesData from '@/components/tools/howto/data/guides.generated.json';

// Identity translator: parentToolName resolves to the raw key, so tests can
// assert the correct key path was used without depending on message catalogs.
const t = (key: string) => key;

const EXPECTED_COUNT =
  termsData.length +
  rankingsData.length +
  bookmarksData.length +
  (devPeopleData as { peoples: unknown[] }).peoples.length +
  guidesData.length;

describe('toSearchableSpokes', () => {
  it('builds one spoke per entity across all 5 collections (ko)', () => {
    expect(toSearchableSpokes(t, 'ko')).toHaveLength(EXPECTED_COUNT);
  });

  it('builds the same count for en', () => {
    expect(toSearchableSpokes(t, 'en')).toHaveLength(EXPECTED_COUNT);
  });

  it('maps new-word term/definition and folds aliases into keywords (ko)', () => {
    const spokes = toSearchableSpokes(t, 'ko');
    const go = spokes.find((s) => s.tool === 'new-word' && s.slug === 'go-neung');
    expect(go).toBeDefined();
    expect(go!.name).toBe('고능');
    expect(go!.description.length).toBeGreaterThan(0);
    expect(go!.keywords).toContain('고능하다');
  });

  it('maps dev-people via the .peoples wrapper (name/knownFor/aliases)', () => {
    const spokes = toSearchableSpokes(t, 'en');
    const turing = spokes.find(
      (s) => s.tool === 'dev-people' && s.slug === 'alan-turing'
    );
    expect(turing).toBeDefined();
    expect(turing!.name).toBe('Alan Turing');
    expect(turing!.keywords.length).toBeGreaterThan(0);
  });

  it('wires parent tool accent/icon/name from the registry', () => {
    const spokes = toSearchableSpokes(t, 'ko');
    const nw = spokes.find((s) => s.tool === 'new-word')!;
    expect(nw.accent).toBe('mint');
    expect(nw.icon).toBe('BookA');
    expect(nw.parentToolName).toBe('tools.new-word.title');
    expect(spokes.find((s) => s.tool === 'rankings')!.accent).toBe('rose');
    expect(spokes.find((s) => s.tool === 'bookmarks')!.accent).toBe('sky');
    expect(spokes.find((s) => s.tool === 'dev-people')!.icon).toBe('Users');
    expect(spokes.find((s) => s.tool === 'howto')!.icon).toBe('BookOpen');
  });

  it('truncates long descriptions and strips markdown', () => {
    const spokes = toSearchableSpokes(t, 'ko');
    spokes.forEach((s) => {
      expect(s.description.length).toBeLessThanOrEqual(101); // 100 + ellipsis
      expect(s.description).not.toMatch(/\*\*/); // bold markers stripped
    });
  });

  it('uses locale-specific fields (en differs from ko, no hangul leak in en names)', () => {
    const ko = toSearchableSpokes(t, 'ko').find((s) => s.slug === 'go-neung')!;
    const en = toSearchableSpokes(t, 'en').find((s) => s.slug === 'go-neung')!;
    expect(ko.name).toBe('고능');
    expect(en.name).not.toBe('고능');
    expect(en.name).not.toMatch(/[가-힣]/);
  });
});
