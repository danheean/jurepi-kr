import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import type { RankingFileFront } from './schema';

describe('merge — canonical rule application', () => {
  const validKo: RankingFileFront = {
    title: 'LLM 에이전트 순위',
    field: 'ai',
    asOfDate: '2026-06',
    sourceNote: 'Agent Arena 리더보드 기준',
    slug: 'llm-agent-leaderboard',
    items: [
      { rank: 1, name: 'Claude Opus', description: 'Best agent' },
      { rank: 2, name: 'GPT 5.5', description: 'Strong performer' },
      { rank: 3, name: 'Gemini 2.0', description: 'Good reasoning' },
    ],
  };

  const validEn: RankingFileFront = {
    title: 'LLM Agent Leaderboard',
    field: 'ai',
    asOfDate: '2026-06',
    sourceNote: 'Agent Arena 리더보드 기준',
    items: [
      { rank: 1, name: 'Claude Opus', description: 'Best agent' },
      { rank: 2, name: 'GPT 5.5', description: 'Strong performer' },
      { rank: 3, name: 'Gemini 2.0', description: 'Good reasoning' },
    ],
  };

  describe('mergePair', () => {
    it('merges ko and en with canonical rule', () => {
      const merged = mergePair(validKo, validEn, 'llm-agent.md');
      expect(merged.slug).toBe('llm-agent-leaderboard');
      expect(merged.field).toBe('ai');
      expect(merged.asOfDate).toBe('2026-06');
      expect(merged.sourceNote).toBe('Agent Arena 리더보드 기준');
      expect(merged.ko.title).toBe('LLM 에이전트 순위');
      expect(merged.en.title).toBe('LLM Agent Leaderboard');
    });

    it('uses KO field as canonical', () => {
      const merged = mergePair(validKo, validEn, 'test.md');
      expect(merged.field).toBe(validKo.field);
    });

    it('uses KO asOfDate as canonical', () => {
      const merged = mergePair(validKo, validEn, 'test.md');
      expect(merged.asOfDate).toBe(validKo.asOfDate);
    });

    it('uses KO sourceNote as canonical', () => {
      const merged = mergePair(validKo, validEn, 'test.md');
      expect(merged.sourceNote).toBe(validKo.sourceNote);
    });

    it('uses KO sourceUrl as canonical (if present)', () => {
      const koWithUrl = { ...validKo, sourceUrl: 'https://example.com' };
      const merged = mergePair(koWithUrl, validEn, 'test.md');
      expect(merged.sourceUrl).toBe('https://example.com');
    });

    it('preserves independent locale items', () => {
      const merged = mergePair(validKo, validEn, 'test.md');
      expect(merged.ko.items).toEqual(validKo.items);
      expect(merged.en.items).toEqual(validEn.items);
    });

    it('allows different items per locale', () => {
      const enWithDifferentItems = {
        ...validEn,
        items: [
          { rank: 1, name: 'Anthropic Claude', description: 'Top agent' },
          { rank: 2, name: 'OpenAI GPT', description: 'Solid performer' },
          { rank: 3, name: 'Google Gemini', description: 'Fair reasoning' },
        ],
      };
      const merged = mergePair(validKo, enWithDifferentItems, 'test.md');
      expect(merged.ko.items[0].name).toBe('Claude Opus');
      expect(merged.en.items[0].name).toBe('Anthropic Claude');
    });

    it('derives slug from filename if not in frontmatter', () => {
      const koNoSlug = { ...validKo };
      delete koNoSlug.slug;
      const merged = mergePair(koNoSlug, validEn, 'best-sushi.md');
      expect(merged.slug).toBe('best-sushi');
    });
  });

  describe('validatePair', () => {
    it('succeeds with valid ko and en pair', () => {
      const { ranking, errors } = validatePair('test.md', validKo, validEn);
      expect(ranking).not.toBeNull();
      expect(errors).toEqual([]);
    });

    it('reports KO parse error', () => {
      const invalidKo = { title: '', field: 'ai' }; // missing required fields
      const { ranking, errors } = validatePair('test.md', invalidKo, validEn);
      expect(ranking).toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('KO parse error');
    });

    it('reports EN parse error', () => {
      const invalidEn = { title: '', field: 'ai' }; // missing required fields
      const { ranking, errors } = validatePair('test.md', validKo, invalidEn);
      expect(ranking).toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('EN parse error');
    });

    it('detects field mismatch', () => {
      const enWithDifferentField = { ...validEn, field: 'programming' };
      const { ranking, errors } = validatePair(
        'test.md',
        validKo,
        enWithDifferentField
      );
      expect(ranking).toBeNull();
      expect(errors.some((e) => e.includes('field must match'))).toBe(true);
    });

    it('detects asOfDate mismatch', () => {
      const enWithDifferentDate = { ...validEn, asOfDate: '2026-05' };
      const { ranking, errors } = validatePair(
        'test.md',
        validKo,
        enWithDifferentDate
      );
      expect(ranking).toBeNull();
      expect(errors.some((e) => e.includes('asOfDate must match'))).toBe(true);
    });

    it('detects sourceNote mismatch', () => {
      const enWithDifferentNote = { ...validEn, sourceNote: 'Different source' };
      const { ranking, errors } = validatePair(
        'test.md',
        validKo,
        enWithDifferentNote
      );
      expect(ranking).toBeNull();
      expect(errors.some((e) => e.includes('sourceNote must match'))).toBe(true);
    });

    it('detects sourceUrl mismatch', () => {
      const koWithUrl = { ...validKo, sourceUrl: 'https://example1.com' };
      const enWithDifferentUrl = {
        ...validEn,
        sourceUrl: 'https://example2.com',
      };
      const { ranking, errors } = validatePair(
        'test.md',
        koWithUrl,
        enWithDifferentUrl
      );
      expect(ranking).toBeNull();
      expect(errors.some((e) => e.includes('sourceUrl must match'))).toBe(true);
    });

    it('allows EN to omit canonical fields (inherits from KO)', () => {
      const enMinimal = {
        title: 'LLM Agent Leaderboard',
        items: validEn.items,
      };
      const { ranking, errors } = validatePair(
        'test.md',
        validKo,
        enMinimal as RankingFileFront
      );
      // Should succeed: EN inherits field, asOfDate, sourceNote from KO
      expect(errors.length).toBe(0);
      expect(ranking).not.toBeNull();
      expect(ranking?.field).toBe(validKo.field);
    });

    it('returns error details in filename context', () => {
      const invalidKo = { title: 'Test', field: 'invalid-field' };
      const { errors } = validatePair('my-ranking.md', invalidKo, validEn);
      expect(errors[0]).toContain('my-ranking.md');
    });
  });
});
