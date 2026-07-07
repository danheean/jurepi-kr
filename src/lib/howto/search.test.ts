import { describe, it, expect } from 'vitest';
import { filterGuides } from './search';
import { MergedGuide } from './schema';

const fixture: MergedGuide[] = [
  {
    slug: 'install-claude-code',
    topic: 'setup',
    tags: ['install', 'cli', 'claude'],
    order: 1,
    related: [],
    ko: {
      title: '클로드 코드 설치하는 법',
      summary: 'macOS, Windows, Linux에서 Claude Code를 설치합니다',
      body: 'Installation guide'
    },
    en: {
      title: 'How to Install Claude Code',
      summary: 'Install Claude Code on macOS, Windows, and Linux',
      body: 'Installation guide'
    }
  },
  {
    slug: 'issue-api-token',
    topic: 'api',
    tags: ['token', 'auth', 'api'],
    order: 1,
    related: [],
    ko: {
      title: 'API 토큰 발급하는 법',
      summary: '인증 토큰을 발급하고 관리합니다',
      body: 'Token guide'
    },
    en: {
      title: 'How to Issue an API Token',
      summary: 'Create and manage authentication tokens',
      body: 'Token guide'
    }
  },
  {
    slug: 'git-worktree',
    topic: 'git',
    tags: ['git', 'workflow', 'branch'],
    order: 1,
    related: [],
    ko: {
      title: 'Git Worktree 사용하는 법',
      summary: '여러 브랜치를 동시에 작업합니다',
      body: 'Git worktree guide'
    },
    en: {
      title: 'How to Use Git Worktree',
      summary: 'Work on multiple branches simultaneously',
      body: 'Git worktree guide'
    }
  }
];

describe('filterGuides', () => {
  it('returns all guides when query is empty', () => {
    const result = filterGuides(fixture, '');
    expect(result).toHaveLength(3);
  });

  it('returns all guides when query is only whitespace', () => {
    const result = filterGuides(fixture, '   ');
    expect(result).toHaveLength(3);
  });

  it('matches Korean title', () => {
    const result = filterGuides(fixture, '클로드');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('install-claude-code');
  });

  it('matches English title', () => {
    const result = filterGuides(fixture, 'Install');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('install-claude-code');
  });

  it('matches Korean summary', () => {
    const result = filterGuides(fixture, '인증');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('issue-api-token');
  });

  it('matches English summary', () => {
    const result = filterGuides(fixture, 'authentication');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('issue-api-token');
  });

  it('matches tags', () => {
    const result = filterGuides(fixture, 'token');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('issue-api-token');
  });

  it('matches topic', () => {
    const result = filterGuides(fixture, 'setup');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('install-claude-code');
  });

  it('is case insensitive', () => {
    const result1 = filterGuides(fixture, 'Claude');
    const result2 = filterGuides(fixture, 'CLAUDE');
    const result3 = filterGuides(fixture, 'claude');
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it('returns multiple matches', () => {
    const result = filterGuides(fixture, 'git');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('git-worktree');
  });

  it('handles no matches', () => {
    const result = filterGuides(fixture, 'nonexistent query');
    expect(result).toHaveLength(0);
  });

  it('searches both Korean and English in same query', () => {
    const result = filterGuides(fixture, 'branch');
    // "branch" is in git-worktree tags and English summary
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('git-worktree');
  });
});
