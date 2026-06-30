import { describe, it, expect } from 'vitest';
import {
  SearchableTool,
  matchTool,
  filterTools,
  sortTools,
  deriveCategories,
  CategoryOption,
  FilterOptions,
} from './tool-search';
import type { ToolCategory, AccentColor } from '@/tools/types';

// Test fixtures
const createTool = (overrides?: Partial<SearchableTool>): SearchableTool => ({
  id: 'test-tool',
  slug: 'test-tool',
  category: 'random' as ToolCategory,
  accent: 'coral' as AccentColor,
  icon: 'ListTree',
  status: 'live' as const,
  isNew: false,
  isPopular: false,
  order: 1,
  keywords: ['test', 'tool'],
  name: 'Test Tool',
  description: 'A test tool for testing',
  ...overrides,
});

describe('matchTool', () => {
  it('returns true when query is empty', () => {
    const tool = createTool();
    expect(matchTool(tool, '')).toBe(true);
  });

  it('returns true when query is only whitespace', () => {
    const tool = createTool();
    expect(matchTool(tool, '   ')).toBe(true);
  });

  it('matches Ko query in name (사다리)', () => {
    const tool = createTool({
      name: '사다리 타기',
      keywords: ['사다리', 'ladder'],
    });
    expect(matchTool(tool, '사다리')).toBe(true);
  });

  it('matches En query in name (ladder)', () => {
    const tool = createTool({
      name: 'Ladder Game',
      keywords: ['ladder', 'climbing'],
    });
    expect(matchTool(tool, 'ladder')).toBe(true);
  });

  it('matches mixed case query', () => {
    const tool = createTool({
      name: 'Ladder Game',
    });
    expect(matchTool(tool, 'LADDER')).toBe(true);
    expect(matchTool(tool, 'LaDdEr')).toBe(true);
  });

  it('matches query in description', () => {
    const tool = createTool({
      description: 'A climbing game for fun',
    });
    expect(matchTool(tool, 'climbing')).toBe(true);
  });

  it('matches query in keywords only', () => {
    const tool = createTool({
      name: 'Game',
      description: 'A fun game',
      keywords: ['ladder', 'climbing'],
    });
    expect(matchTool(tool, 'ladder')).toBe(true);
  });

  it('matches substring mid-word', () => {
    const tool = createTool({
      name: 'Ladder',
    });
    expect(matchTool(tool, 'add')).toBe(true);
  });

  it('returns false for non-matching query', () => {
    const tool = createTool({
      name: 'Ladder',
      description: 'A climbing game',
      keywords: ['game', 'fun'],
    });
    expect(matchTool(tool, 'xyz')).toBe(false);
  });

  it('trims whitespace from query', () => {
    const tool = createTool({
      name: 'Ladder',
    });
    expect(matchTool(tool, '  ladder  ')).toBe(true);
  });
});

describe('filterTools', () => {
  it('filters by query only', () => {
    const tools = [
      createTool({ id: 'ladder', name: 'Ladder' }),
      createTool({ id: 'picker', name: 'Random Picker' }),
    ];
    const result = filterTools(tools, { query: 'ladder' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ladder');
  });

  it('filters by category only', () => {
    const tools = [
      createTool({ id: 'ladder', category: 'random' as ToolCategory }),
      createTool({ id: 'counter', category: 'text' as ToolCategory }),
    ];
    const result = filterTools(tools, { category: 'random' as ToolCategory });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ladder');
  });

  it('filters by query and category combined', () => {
    const tools = [
      createTool({
        id: 'ladder',
        name: 'Ladder',
        category: 'random' as ToolCategory,
      }),
      createTool({
        id: 'counter',
        name: 'Text Counter',
        category: 'text' as ToolCategory,
      }),
      createTool({
        id: 'word',
        name: 'Word Game',
        category: 'random' as ToolCategory,
      }),
    ];
    const result = filterTools(tools, {
      query: 'counter',
      category: 'random' as ToolCategory,
    });
    expect(result).toHaveLength(0); // 'counter' is in 'text', not 'random'
  });

  it('includes all when category is "all"', () => {
    const tools = [
      createTool({ id: 'ladder', category: 'random' as ToolCategory }),
      createTool({ id: 'counter', category: 'text' as ToolCategory }),
    ];
    const result = filterTools(tools, {
      category: 'all' as const,
    });
    expect(result).toHaveLength(2);
  });

  it('includes all when category is undefined', () => {
    const tools = [
      createTool({ id: 'ladder', category: 'random' as ToolCategory }),
      createTool({ id: 'counter', category: 'text' as ToolCategory }),
    ];
    const result = filterTools(tools, {});
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no match', () => {
    const tools = [
      createTool({ id: 'ladder', name: 'Ladder' }),
      createTool({ id: 'picker', name: 'Picker' }),
    ];
    const result = filterTools(tools, { query: 'xyz' });
    expect(result).toHaveLength(0);
  });

  it('does not mutate input array', () => {
    const tools = [
      createTool({ id: 'ladder' }),
      createTool({ id: 'picker' }),
    ];
    const original = [...tools];
    filterTools(tools, { query: 'ladder' });
    expect(tools).toEqual(original);
  });
});

describe('sortTools', () => {
  it('pins popular tools first', () => {
    const tools = [
      createTool({ id: '1', isPopular: false, order: 1 }),
      createTool({ id: '2', isPopular: true, order: 2 }),
      createTool({ id: '3', isPopular: false, order: 3 }),
    ];
    const result = sortTools(tools);
    expect(result[0].id).toBe('2');
  });

  it('sorts by order ascending among non-popular', () => {
    const tools = [
      createTool({ id: '1', isPopular: false, order: 3 }),
      createTool({ id: '2', isPopular: false, order: 1 }),
      createTool({ id: '3', isPopular: false, order: 2 }),
    ];
    const result = sortTools(tools);
    expect(result.map(t => t.id)).toEqual(['2', '3', '1']);
  });

  it('pushes coming_soon to end', () => {
    const tools = [
      createTool({ id: '1', status: 'live' as const, order: 1 }),
      createTool({ id: '2', status: 'coming_soon' as const, order: 0 }),
      createTool({ id: '3', status: 'live' as const, order: 2 }),
    ];
    const result = sortTools(tools);
    expect(result.map(t => t.id)).toEqual(['1', '3', '2']);
  });

  it('combines all sort criteria: popular DESC > order ASC > coming_soon last', () => {
    const tools = [
      createTool({
        id: '1',
        isPopular: false,
        status: 'coming_soon' as const,
        order: 1,
      }),
      createTool({
        id: '2',
        isPopular: true,
        status: 'live' as const,
        order: 5,
      }),
      createTool({
        id: '3',
        isPopular: false,
        status: 'live' as const,
        order: 2,
      }),
      createTool({
        id: '4',
        isPopular: false,
        status: 'live' as const,
        order: 1,
      }),
    ];
    const result = sortTools(tools);
    expect(result.map(t => t.id)).toEqual(['2', '4', '3', '1']);
  });

  it('does not mutate input array', () => {
    const tools = [
      createTool({ id: '1', order: 2 }),
      createTool({ id: '2', order: 1 }),
    ];
    const original = [...tools];
    sortTools(tools);
    expect(tools).toEqual(original);
  });

  it('returns a new array instance', () => {
    const tools = [createTool()];
    const result = sortTools(tools);
    expect(result).not.toBe(tools);
  });
});

describe('deriveCategories', () => {
  it('always includes "all" as first entry', () => {
    const tools = [createTool({ category: 'random' as ToolCategory })];
    const result = deriveCategories(tools);
    expect(result[0].id).toBe('all');
  });

  it('includes only categories present in tools', () => {
    const tools = [
      createTool({ id: '1', category: 'random' as ToolCategory }),
      createTool({ id: '2', category: 'text' as ToolCategory }),
    ];
    const result = deriveCategories(tools);
    const ids = result.map(r => r.id);
    expect(ids).toContain('random');
    expect(ids).toContain('text');
    expect(ids).not.toContain('calculator');
  });

  it('returns categories in stable order: all > random > calculator > text > converter > fun', () => {
    const tools = [
      createTool({ category: 'fun' as ToolCategory }),
      createTool({ category: 'calculator' as ToolCategory }),
      createTool({ category: 'random' as ToolCategory }),
      createTool({ category: 'converter' as ToolCategory }),
      createTool({ category: 'text' as ToolCategory }),
    ];
    const result = deriveCategories(tools);
    expect(result.map(r => r.id)).toEqual([
      'all',
      'random',
      'calculator',
      'text',
      'converter',
      'fun',
    ]);
  });

  it('returns empty list as only "all"', () => {
    const result = deriveCategories([]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('all');
  });

  it('includes categories with all coming_soon tools', () => {
    const tools = [
      createTool({
        id: '1',
        category: 'random' as ToolCategory,
        status: 'coming_soon' as const,
      }),
      createTool({
        id: '2',
        category: 'text' as ToolCategory,
        status: 'coming_soon' as const,
      }),
    ];
    const result = deriveCategories(tools);
    const ids = result.map(r => r.id);
    expect(ids).toContain('random');
    expect(ids).toContain('text');
  });

  it('generates correct labelKey format', () => {
    const tools = [createTool({ category: 'random' as ToolCategory })];
    const result = deriveCategories(tools);
    const allEntry = result.find(r => r.id === 'all');
    const randomEntry = result.find(r => r.id === 'random');
    expect(allEntry?.labelKey).toBe('categories.all');
    expect(randomEntry?.labelKey).toBe('categories.random');
  });

  it('deduplicates categories', () => {
    const tools = [
      createTool({ category: 'random' as ToolCategory }),
      createTool({ category: 'random' as ToolCategory }),
      createTool({ category: 'random' as ToolCategory }),
    ];
    const result = deriveCategories(tools);
    const randomCount = result.filter(r => r.id === 'random').length;
    expect(randomCount).toBe(1);
  });
});
