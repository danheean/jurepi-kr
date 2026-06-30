import { describe, it, expect } from 'vitest';
import { toSearchableTools, type Translator } from '@/lib/searchable-tools';
import type { ToolMeta } from '@/tools/types';
import type { SearchableTool } from '@/lib/tool-search';

describe('toSearchableTools', () => {
  // Fixture: minimal registry-like tools
  const fixtureTools: ToolMeta[] = [
    {
      id: 'ladder',
      slug: 'ladder',
      category: 'random',
      icon: 'ListTree',
      accent: 'coral',
      status: 'live',
      isNew: true,
      isPopular: true,
      order: 1,
      keywords: ['사다리', 'ladder'],
    },
    {
      id: 'picker',
      slug: 'picker',
      category: 'random',
      icon: 'Dices',
      accent: 'rose',
      status: 'coming_soon',
      order: 2,
      keywords: ['추첨', 'picker'],
    },
  ];

  // Fake translator: returns the key as-is
  const fakeTranslator: Translator = (key: string): string => key;

  it('should return an array of SearchableTool', () => {
    const result = toSearchableTools(fixtureTools, fakeTranslator);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('should preserve all ToolMeta fields', () => {
    const result = toSearchableTools(fixtureTools, fakeTranslator);
    const firstTool = result[0];

    expect(firstTool.id).toBe('ladder');
    expect(firstTool.slug).toBe('ladder');
    expect(firstTool.category).toBe('random');
    expect(firstTool.icon).toBe('ListTree');
    expect(firstTool.accent).toBe('coral');
    expect(firstTool.status).toBe('live');
    expect(firstTool.isNew).toBe(true);
    expect(firstTool.isPopular).toBe(true);
    expect(firstTool.order).toBe(1);
    expect(firstTool.keywords).toEqual(['사다리', 'ladder']);
  });

  it('should add localized name using translator', () => {
    const result = toSearchableTools(fixtureTools, fakeTranslator);
    const firstTool = result[0];

    expect(firstTool.name).toBe('tools.ladder.title');
  });

  it('should add localized description using translator', () => {
    const result = toSearchableTools(fixtureTools, fakeTranslator);
    const firstTool = result[0];

    expect(firstTool.description).toBe('tools.ladder.description');
  });

  it('should work with a custom translator function', () => {
    const customTranslator: Translator = (key: string): string => {
      const translations: Record<string, string> = {
        'tools.ladder.title': 'Ladder Game',
        'tools.ladder.description': 'A fun ladder drawing game',
        'tools.picker.title': 'Picker',
        'tools.picker.description': 'Random picker tool',
      };
      return translations[key] || key;
    };

    const result = toSearchableTools(fixtureTools, customTranslator);

    expect(result[0].name).toBe('Ladder Game');
    expect(result[0].description).toBe('A fun ladder drawing game');
    expect(result[1].name).toBe('Picker');
    expect(result[1].description).toBe('Random picker tool');
  });

  it('should return immutable copy (not mutate original)', () => {
    const originalTools = [...fixtureTools];
    const result = toSearchableTools(fixtureTools, fakeTranslator);

    // Verify original is unchanged
    expect(fixtureTools).toEqual(originalTools);

    // Verify result is a different array instance
    expect(result).not.toBe(fixtureTools);
  });

  it('should handle empty tools array', () => {
    const result = toSearchableTools([], fakeTranslator);
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should preserve optional fields like isNew and isPopular', () => {
    const toolsWithOptionals: ToolMeta[] = [
      {
        id: 'test1',
        slug: 'test1',
        category: 'fun',
        icon: 'Test',
        accent: 'mint',
        status: 'live',
        order: 1,
        keywords: [],
        isNew: true,
        isPopular: false,
      },
      {
        id: 'test2',
        slug: 'test2',
        category: 'fun',
        icon: 'Test',
        accent: 'mint',
        status: 'coming_soon',
        order: 2,
        keywords: [],
        // isNew and isPopular omitted
      },
    ];

    const result = toSearchableTools(toolsWithOptionals, fakeTranslator);

    expect(result[0].isNew).toBe(true);
    expect(result[0].isPopular).toBe(false);
    expect(result[1].isNew).toBeUndefined();
    expect(result[1].isPopular).toBeUndefined();
  });

  it('should produce tools that conform to SearchableTool interface', () => {
    const result = toSearchableTools(fixtureTools, fakeTranslator);

    result.forEach((tool) => {
      // Check that all required SearchableTool fields exist
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('slug');
      expect(tool).toHaveProperty('category');
      expect(tool).toHaveProperty('icon');
      expect(tool).toHaveProperty('accent');
      expect(tool).toHaveProperty('status');
      expect(tool).toHaveProperty('order');
      expect(tool).toHaveProperty('keywords');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');

      // Check types
      expect(typeof tool.id).toBe('string');
      expect(typeof tool.slug).toBe('string');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(typeof tool.order).toBe('number');
      expect(Array.isArray(tool.keywords)).toBe(true);
    });
  });

  it('should handle various status values correctly', () => {
    const toolsWithStatuses: ToolMeta[] = [
      {
        id: 'live_tool',
        slug: 'live_tool',
        category: 'fun',
        icon: 'Live',
        accent: 'mint',
        status: 'live',
        order: 1,
        keywords: [],
      },
      {
        id: 'coming_tool',
        slug: 'coming_tool',
        category: 'fun',
        icon: 'Coming',
        accent: 'mint',
        status: 'coming_soon',
        order: 2,
        keywords: [],
      },
    ];

    const result = toSearchableTools(toolsWithStatuses, fakeTranslator);

    expect(result[0].status).toBe('live');
    expect(result[1].status).toBe('coming_soon');
  });
});
