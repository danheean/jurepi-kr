import { describe, it, expect } from 'vitest';
import { allGuides, byId, byTopic, topics, readingTime, TOPIC_ORDER } from './catalog';
import { MergedGuide } from './schema';

const fixture: MergedGuide[] = [
  {
    slug: 'install-claude-code',
    topic: 'setup',
    tags: ['install', 'cli'],
    order: 1,
    related: [],
    ko: { title: 'Installation', summary: 'How to install', body: 'Korean body content' },
    en: { title: 'Installation', summary: 'How to install', body: 'English body content' }
  },
  {
    slug: 'issue-api-token',
    topic: 'api',
    tags: ['token', 'auth'],
    order: 2,
    related: [],
    ko: { title: 'Token', summary: 'How to issue', body: 'Korean token guide' },
    en: { title: 'Token', summary: 'How to issue', body: 'English token guide' }
  },
  {
    slug: 'git-worktree',
    topic: 'git',
    tags: ['git', 'workflow'],
    order: 1,
    related: [],
    ko: { title: 'Worktree', summary: 'Git worktree', body: 'Git body' },
    en: { title: 'Worktree', summary: 'Git worktree', body: 'Git body' }
  }
];

describe('allGuides', () => {
  it('returns all guides', () => {
    const result = allGuides(fixture);
    expect(result).toHaveLength(3);
    expect(result).toEqual(fixture);
  });

  it('returns empty array for empty catalog', () => {
    expect(allGuides([])).toEqual([]);
  });
});

describe('byId', () => {
  it('finds guide by slug', () => {
    const result = byId(fixture, 'install-claude-code');
    expect(result).toEqual(fixture[0]);
  });

  it('returns undefined for non-existent slug', () => {
    const result = byId(fixture, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty catalog', () => {
    const result = byId([], 'any-slug');
    expect(result).toBeUndefined();
  });
});

describe('byTopic', () => {
  it('filters guides by topic', () => {
    const result = byTopic(fixture, 'setup');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('install-claude-code');
  });

  it('returns empty array for topic with no guides', () => {
    const result = byTopic(fixture, 'cli');
    expect(result).toHaveLength(0);
  });

  it('returns multiple guides for topic with multiple guides', () => {
    const multiTopic = [...fixture, {
      slug: 'another-setup',
      topic: 'setup' as const,
      tags: [],
      order: 2,
      related: [],
      ko: { title: 'Another', summary: 'Setup', body: 'Body' },
      en: { title: 'Another', summary: 'Setup', body: 'Body' }
    }];
    const result = byTopic(multiTopic, 'setup');
    expect(result).toHaveLength(2);
  });
});

describe('topics', () => {
  it('returns topics in fixed order', () => {
    const result = topics(fixture);
    expect(result).toEqual(['setup', 'git', 'api']);
  });

  it('returns only topics present in catalog', () => {
    const singleTopic = [fixture[0]];
    const result = topics(singleTopic);
    expect(result).toEqual(['setup']);
  });

  it('returns empty array for empty catalog', () => {
    expect(topics([])).toEqual([]);
  });

  it('respects TOPIC_ORDER constant', () => {
    expect(TOPIC_ORDER).toEqual([
      'setup',
      'ai-tools',
      'git',
      'api',
      'cli',
      'deploy'
    ]);
  });
});

describe('readingTime', () => {
  it('calculates reading time based on word count', () => {
    // 200 words = 1 min
    const body200 = Array(200).fill('word').join(' ');
    expect(readingTime(body200)).toBe(1);
  });

  it('rounds up partial minutes', () => {
    // 201 words = ceil(201/200) = 2 min
    const body201 = Array(201).fill('word').join(' ');
    expect(readingTime(body201)).toBe(2);
  });

  it('returns minimum 1 minute for short content', () => {
    expect(readingTime('a few words')).toBe(1);
    expect(readingTime('')).toBe(1);
  });

  it('handles large content', () => {
    // 4000 words = 20 min
    const body4000 = Array(4000).fill('word').join(' ');
    expect(readingTime(body4000)).toBe(20);
  });

  it('ignores leading/trailing whitespace', () => {
    const body = '  ' + Array(200).fill('word').join(' ') + '  ';
    expect(readingTime(body)).toBe(1);
  });
});
