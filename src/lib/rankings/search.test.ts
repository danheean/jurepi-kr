import { describe, it, expect } from 'vitest';
import { normalizeSearchText, filterRankings } from './search';
import type { MergedRanking } from './schema';

describe('search', () => {
  describe('normalizeSearchText', () => {
    it('converts to lowercase', () => {
      expect(normalizeSearchText('HELLO')).toBe('hello');
    });

    it('removes spaces', () => {
      expect(normalizeSearchText('hello world')).toBe('helloworld');
    });

    it('removes hyphens', () => {
      expect(normalizeSearchText('hello-world')).toBe('helloworld');
    });

    it('removes underscores', () => {
      expect(normalizeSearchText('hello_world')).toBe('helloworld');
    });

    it('handles diacritics with NFC normalization', () => {
      const text = 'café';
      const normalized = normalizeSearchText(text);
      expect(normalized).toBe('café'); // NFC preserves composed form
    });

    it('combines multiple transformations', () => {
      expect(normalizeSearchText('Hello-World_2024')).toBe('helloworld2024');
    });

    it('handles empty string', () => {
      expect(normalizeSearchText('')).toBe('');
    });
  });

  describe('filterRankings', () => {
    const mockCatalog: MergedRanking[] = [
      {
        slug: 'llm-agents',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Agent Arena',
        ko: {
          title: 'AI 에이전트 순위',
          items: [
            { rank: 1, name: 'Claude', description: '최고의 에이전트' },
            { rank: 2, name: 'GPT', description: '강력한 성능' },
            { rank: 3, name: 'Gemini', description: '좋은 추론' },
          ],
        },
        en: {
          title: 'AI Agent Leaderboard',
          items: [
            { rank: 1, name: 'Claude', description: 'Best agent' },
            { rank: 2, name: 'GPT', description: 'Strong performer' },
            { rank: 3, name: 'Gemini', description: 'Good reasoning' },
          ],
        },
      },
      {
        slug: 'programming-langs',
        field: 'programming',
        asOfDate: '2026-06',
        sourceNote: 'TIOBE Index',
        ko: {
          title: '프로그래밍 언어 순위',
          items: [
            { rank: 1, name: 'Python', description: '가장 인기 있음' },
            { rank: 2, name: 'C', description: '시스템 언어' },
            { rank: 3, name: 'C++', description: '고성능' },
          ],
        },
        en: {
          title: 'Programming Languages',
          items: [
            { rank: 1, name: 'Python', description: 'Most popular' },
            { rank: 2, name: 'C', description: 'Systems language' },
            { rank: 3, name: 'C++', description: 'High performance' },
          ],
        },
      },
    ];

    it('returns all rankings for empty query', () => {
      const results = filterRankings(mockCatalog, '');
      expect(results).toEqual(mockCatalog);
    });

    it('returns all rankings for whitespace-only query', () => {
      const results = filterRankings(mockCatalog, '   ');
      expect(results).toEqual(mockCatalog);
    });

    it('matches KO title', () => {
      const results = filterRankings(mockCatalog, 'AI');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('llm-agents');
    });

    it('matches EN title', () => {
      const results = filterRankings(mockCatalog, 'Programming');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('programming-langs');
    });

    it('matches KO item name', () => {
      const results = filterRankings(mockCatalog, 'Python');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('programming-langs');
    });

    it('matches EN item name', () => {
      const results = filterRankings(mockCatalog, 'Claude');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('llm-agents');
    });

    it('matches KO item description', () => {
      const results = filterRankings(mockCatalog, '에이전트');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('llm-agents');
    });

    it('matches EN item description', () => {
      const results = filterRankings(mockCatalog, 'popular');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('programming-langs');
    });

    it('matches field', () => {
      const results = filterRankings(mockCatalog, 'ai');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('llm-agents');
    });

    it('is case insensitive', () => {
      const results1 = filterRankings(mockCatalog, 'python');
      const results2 = filterRankings(mockCatalog, 'PYTHON');
      const results3 = filterRankings(mockCatalog, 'Python');
      expect(results1).toEqual(results2);
      expect(results2).toEqual(results3);
    });

    it('is space insensitive', () => {
      const results1 = filterRankings(mockCatalog, 'AI Agent');
      const results2 = filterRankings(mockCatalog, 'AIAgent');
      expect(results1).toEqual(results2);
    });

    it('is hyphen insensitive', () => {
      const results1 = filterRankings(mockCatalog, 'Agent-Leaderboard');
      const results2 = filterRankings(mockCatalog, 'AgentLeaderboard');
      expect(results1).toEqual(results2);
    });

    it('returns empty array for non-matching query', () => {
      const results = filterRankings(mockCatalog, 'xyz12345');
      expect(results).toEqual([]);
    });

    it('matches multiple rankings', () => {
      const results = filterRankings(mockCatalog, '순위');
      expect(results.length).toBe(2);
    });

    it('preserves order of input catalog', () => {
      const results = filterRankings(mockCatalog, '');
      expect(results).toEqual(mockCatalog);
    });

    it('returns stable filtered order', () => {
      const results1 = filterRankings(mockCatalog, 'Leaderboard Index');
      const results2 = filterRankings(mockCatalog, 'Leaderboard Index');
      expect(results1).toEqual(results2);
    });
  });
});
