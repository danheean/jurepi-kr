/**
 * Validation tests for the glossary generator.
 * Tests fixture content and verifies generator behaviors:
 * - pair-missing → failure
 * - dupe-slug → failure
 * - dangling-related → failure
 * - empty-required-field → failure
 * - valid catalog → success
 * - final catalog passes MergedTermSchema
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  execSync,
  spawnSync,
} from 'node:child_process';
import {
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { MergedTermSchema } from '../lib/new-word/schema';

const FIXTURE_BASE = join(process.cwd(), '.vitest-glossary-fixtures');

function createFixture(name: string): string {
  const path = join(FIXTURE_BASE, name);
  mkdirSync(path, { recursive: true });
  mkdirSync(join(path, 'content/new-word/terms'), { recursive: true });
  mkdirSync(join(path, 'src/components/tools/new-word/data'), {
    recursive: true,
  });
  return path;
}

function cleanupFixture(path: string) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}

function writeTerm(
  fixturePath: string,
  base: string,
  locale: 'ko' | 'en',
  frontmatter: Record<string, unknown>,
  body = ''
) {
  const suffix = locale === 'en' ? '_en' : '';
  const file = join(fixturePath, `content/new-word/terms/${base}${suffix}.md`);
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}: ${JSON.stringify(v)}`;
      }
      if (typeof v === 'number') {
        return `${k}: ${v}`;
      }
      if (typeof v === 'string' && v.includes('\n')) {
        return `${k}: |\n  ${v.split('\n').join('\n  ')}`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  const content = `---\n${fm}\n---\n\n${body}`;
  writeFileSync(file, content, 'utf8');
}

interface GeneratorResult {
  success: boolean;
  output: string;
  exitCode: number;
  catalog?: Array<Record<string, unknown>>;
}

function runGenerator(fixturePath: string): GeneratorResult {
  try {
    // For simplicity, use execSync with cwd override
    const cmd = `cd "${fixturePath}" && node "${join(process.cwd(), 'scripts/generate-glossary.mjs')}"`;
    execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });

    // Try to read the generated catalog
    const catalogPath = join(
      fixturePath,
      'src/components/tools/new-word/data/terms.generated.json'
    );
    if (existsSync(catalogPath)) {
      const catalog: Array<Record<string, unknown>> = JSON.parse(readFileSync(catalogPath, 'utf8'));
      return { success: true, output: 'Success', exitCode: 0, catalog };
    }
    return { success: true, output: 'Success', exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { status?: number; stderr?: Buffer; stdout?: Buffer; message?: string };
    return {
      success: false,
      output: (error.stderr?.toString() || error.message || '').substring(0, 500),
      exitCode: error.status || 1,
    };
  }
}

describe('glossary generator', () => {
  afterEach(() => {
    cleanupFixture(FIXTURE_BASE);
  });

  it('succeeds on valid minimal catalog', () => {
    const fixture = createFixture('valid-minimal');
    writeTerm(fixture, 'test-term', 'ko', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
      topic: 'mz',
    });
    writeTerm(fixture, 'test-term', 'en', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(0);
    expect(result.catalog).toBeDefined();
    expect(result.catalog).toHaveLength(1);
    expect(result.catalog![0]).toHaveProperty('slug', 'test-term');
  });

  it('fails when Korean file is missing', () => {
    const fixture = createFixture('missing-ko');
    writeTerm(fixture, 'test-term', 'en', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain('missing');
  });

  it('fails when English file is missing', () => {
    const fixture = createFixture('missing-en');
    writeTerm(fixture, 'test-term', 'ko', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
      topic: 'mz',
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain('missing');
  });

  it('fails on empty term field', () => {
    const fixture = createFixture('empty-term');
    writeTerm(fixture, 'test-term', 'ko', {
      term: '',
      definition: 'A test term.',
      examples: ['Example 1'],
      topic: 'mz',
    });
    writeTerm(fixture, 'test-term', 'en', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain('term');
  });

  it('fails on empty examples array', () => {
    const fixture = createFixture('empty-examples');
    writeTerm(fixture, 'test-term', 'ko', {
      term: 'Test',
      definition: 'A test term.',
      examples: [],
      topic: 'mz',
    });
    writeTerm(fixture, 'test-term', 'en', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain('example');
  });

  it('fails on duplicate slugs', () => {
    const fixture = createFixture('dupe-slug');
    writeTerm(fixture, 'term1', 'ko', {
      term: 'Test1',
      slug: 'same-slug',
      definition: 'First term.',
      examples: ['Example 1'],
      topic: 'mz',
    });
    writeTerm(fixture, 'term1', 'en', {
      term: 'Test1',
      definition: 'First term.',
      examples: ['Example 1'],
    });
    writeTerm(fixture, 'term2', 'ko', {
      term: 'Test2',
      slug: 'same-slug',
      definition: 'Second term.',
      examples: ['Example 2'],
      topic: 'mz',
    });
    writeTerm(fixture, 'term2', 'en', {
      term: 'Test2',
      definition: 'Second term.',
      examples: ['Example 2'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).not.toBe(0);
    expect(result.output.toLowerCase()).toContain('duplicate');
  });

  it('fails on dangling related reference', () => {
    const fixture = createFixture('dangling-related');
    writeTerm(fixture, 'test-term', 'ko', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
      topic: 'mz',
      related: ['nonexistent-slug'],
    });
    writeTerm(fixture, 'test-term', 'en', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain('related');
  });

  it('passes MergedTermSchema validation on generated terms', () => {
    const fixture = createFixture('schema-valid');
    writeTerm(fixture, 'test-term', 'ko', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1', 'Example 2'],
      topic: 'tech',
      tags: ['tag1', 'tag2'],
      coinedYear: 2024,
      related: [],
    });
    writeTerm(fixture, 'test-term', 'en', {
      term: 'Test',
      definition: 'A test term.',
      examples: ['Example 1', 'Example 2'],
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(0);
    expect(result.catalog).toHaveLength(1);

    // Validate each record against MergedTermSchema
    result.catalog!.forEach((term) => {
      const validation = MergedTermSchema.safeParse(term);
      expect(validation.success).toBe(true);
    });
  });

  it('handles multiple valid terms correctly', () => {
    const fixture = createFixture('multi-terms');
    const terms = [
      { base: 'term1', ko: 'Test1', en: 'Test1' },
      { base: 'term2', ko: 'Test2', en: 'Test2' },
      { base: 'term3', ko: 'Test3', en: 'Test3' },
    ];

    terms.forEach(({ base, ko, en }) => {
      writeTerm(fixture, base, 'ko', {
        term: ko,
        definition: `Definition of ${ko}.`,
        examples: ['Example'],
        topic: 'mz',
      });
      writeTerm(fixture, base, 'en', {
        term: en,
        definition: `Definition of ${en}.`,
        examples: ['Example'],
      });
    });

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(0);
    expect(result.catalog).toHaveLength(3);
  });
});
