import { describe, it, expect } from 'vitest';
import { CHEATSHEET } from './cheatsheet';

describe('cheatsheet.ts', () => {
  it('has a non-empty list of sections', () => {
    expect(CHEATSHEET.length).toBeGreaterThan(0);
  });

  it('every section has a name and at least one item', () => {
    CHEATSHEET.forEach((section) => {
      expect(section.section.length).toBeGreaterThan(0);
      expect(section.items.length).toBeGreaterThan(0);
    });
  });

  it('every item has a token and a relative descriptionKey', () => {
    CHEATSHEET.forEach((section) => {
      section.items.forEach((item) => {
        expect(item.token.length).toBeGreaterThan(0);
        // Consumed via useTranslations('tools.find-replace') + t(descriptionKey),
        // so the key must be relative (never a rooted `find-replace.`/`tools.` namespace).
        expect(item.descriptionKey.startsWith('cheatsheet.')).toBe(true);
        expect(item.descriptionKey.startsWith('find-replace.')).toBe(false);
      });
    });
  });

  it('has unique descriptionKeys across all items', () => {
    const keys = CHEATSHEET.flatMap((s) => s.items.map((i) => i.descriptionKey));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has unique section names', () => {
    const names = CHEATSHEET.map((s) => s.section);
    expect(new Set(names).size).toBe(names.length);
  });
});
