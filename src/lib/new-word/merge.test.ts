import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import type { TermFileFront } from './schema';

describe('merge — canonical rule application', () => {
  const validKo: TermFileFront = {
    term: '갓생',
    definition: '열심히 사는 삶',
    examples: ['갓생을 산다'],
    slug: 'god-saeng',
    topic: 'mz',
    tags: ['생활', '긍정'],
    related: [],
  };

  const validEn: TermFileFront = {
    term: 'god life',
    definition: 'living productively',
    examples: ['living god life'],
  };

  describe('mergePair', () => {
    it('merges ko and en with canonical rule', () => {
      const merged = mergePair(validKo, validEn);
      expect(merged.slug).toBe('god-saeng');
      expect(merged.topic).toBe('mz');
      expect(merged.tags).toEqual(['생활', '긍정']);
      expect(merged.ko.term).toBe('갓생');
      expect(merged.en.term).toBe('god life');
    });

    it('en inherits topic from ko if absent', () => {
      const en = { ...validEn, topic: undefined };
      const merged = mergePair(validKo, en);
      expect(merged.topic).toBe('mz');
    });

    it('en inherits tags from ko if absent', () => {
      const en = { ...validEn, tags: undefined };
      const merged = mergePair(validKo, en);
      expect(merged.tags).toEqual(['생활', '긍정']);
    });

    it('en inherits related from ko if absent', () => {
      const koWithRelated = { ...validKo, related: ['other-slug'] };
      const en = { ...validEn, related: undefined };
      const merged = mergePair(koWithRelated, en);
      expect(merged.related).toEqual(['other-slug']);
    });

    it('preserves independent locale content', () => {
      const merged = mergePair(validKo, validEn);
      expect(merged.ko.definition).toBe('열심히 사는 삶');
      expect(merged.en.definition).toBe('living productively');
      expect(merged.ko.examples).toEqual(['갓생을 산다']);
      expect(merged.en.examples).toEqual(['living god life']);
    });

    it('preserves optional locale fields', () => {
      const koWithOptional = {
        ...validKo,
        reading: '갓생',
        aliases: ['갓생활'],
        origin: '2020년대 중반',
      };
      const enWithOptional = {
        ...validEn,
        reading: '/gɒd laɪf/',
        aliases: ['productive life'],
        origin: 'Coined in online communities',
      };
      const merged = mergePair(koWithOptional, enWithOptional);
      expect(merged.ko.reading).toBe('갓생');
      expect(merged.ko.aliases).toEqual(['갓생활']);
      expect(merged.en.reading).toBe('/gɒd laɪf/');
    });

    it('body defaults to empty string', () => {
      const merged = mergePair(validKo, validEn);
      expect(merged.ko.body).toBe('');
      expect(merged.en.body).toBe('');
    });

    it('defaults topic to mz if absent from ko', () => {
      const koNoTopic = { ...validKo, topic: undefined };
      const merged = mergePair(koNoTopic, validEn);
      expect(merged.topic).toBe('mz');
    });

    it('defaults tags and related to empty arrays', () => {
      const koMinimal = { ...validKo, tags: undefined, related: undefined };
      const merged = mergePair(koMinimal, validEn);
      expect(merged.tags).toEqual([]);
      expect(merged.related).toEqual([]);
    });
  });

  describe('validatePair', () => {
    it('succeeds with valid ko and en pair', () => {
      const { term, errors } = validatePair('test.md', validKo, validEn);
      expect(errors).toHaveLength(0);
      expect(term).not.toBeNull();
    });

    it('collects schema errors non-blocking', () => {
      const invalidKo = { term: '', definition: 'd', examples: ['e'] };
      const { term, errors } = validatePair('bad.md', invalidKo, validEn);
      expect(errors.length).toBeGreaterThan(0);
      expect(term).toBeNull();
    });

    it('collects multiple validation errors', () => {
      const invalidKo = { term: '', definition: '', examples: [] };
      const { term, errors } = validatePair('bad.md', invalidKo, validEn);
      expect(errors.length).toBeGreaterThan(0);
      expect(term).toBeNull();
    });

    it('detects en topic mismatch with ko', () => {
      const enWithMismatchTopic = { ...validEn, topic: 'tech' };
      const { errors } = validatePair('test.md', validKo, enWithMismatchTopic);
      expect(errors.some((e) => e.includes('topic'))).toBe(true);
    });

    it('allows en to inherit topic when en.topic is undefined', () => {
      const enNoTopic = { ...validEn, topic: undefined };
      const { errors, term } = validatePair('test.md', validKo, enNoTopic);
      expect(errors).toHaveLength(0);
      expect(term?.topic).toBe('mz');
    });

    it('detects en tags mismatch with ko', () => {
      const enWithMismatchTags = { ...validEn, tags: ['different'] };
      const { errors } = validatePair('test.md', validKo, enWithMismatchTags);
      expect(errors.some((e) => e.includes('tags'))).toBe(true);
    });

    it('allows en to inherit tags when en.tags is undefined', () => {
      const enNoTags = { ...validEn, tags: undefined };
      const { errors, term } = validatePair('test.md', validKo, enNoTags);
      expect(errors).toHaveLength(0);
      expect(term?.tags).toEqual(validKo.tags);
    });

    it('includes filename in error messages', () => {
      const badKo = { term: '', definition: 'd', examples: ['e'] };
      const { errors } = validatePair('my-term.md', badKo, validEn);
      expect(errors[0]).toContain('my-term.md');
    });
  });
});
