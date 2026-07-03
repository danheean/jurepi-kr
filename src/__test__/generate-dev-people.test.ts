/**
 * Validation tests for the dev-people generator.
 * Mirrors generate-glossary.test.ts (fixture dir + child-process run):
 * - valid pair → success, body preserved in catalog
 * - pair-missing / knownFor<50 / unknown tag / missing ko structural meta → failure
 * - dangling related / non-http(s) URL / photo without credit / thin body → failure
 * - `_`-prefixed template files are skipped
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import {
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';

const FIXTURE_BASE = join(process.cwd(), '.vitest-dev-people-fixtures');

const KO_BODY = `## 소개

테스트 인물의 전기 본문입니다. 이 단락은 thin-content 가드를 통과할 만큼 충분히 길어야 하므로 실제 전기처럼 두 문장 이상을 씁니다. 컴퓨터 과학의 역사에 큰 발자취를 남긴 인물입니다.

## 일화

재미있는 일화 단락입니다.`;

const EN_BODY = `## About

A test biography body. This paragraph is intentionally long enough to pass the thin-content guard, written like a real biography with more than one sentence about computing history.

## Anecdotes

A fun anecdote paragraph.`;

function createFixture(name: string): string {
  const path = join(FIXTURE_BASE, name);
  mkdirSync(join(path, 'content/dev-people/people'), { recursive: true });
  mkdirSync(join(path, 'public/images/dev-people'), { recursive: true });
  mkdirSync(join(path, 'src/components/tools/dev-people/data'), {
    recursive: true,
  });
  return path;
}

function writePerson(
  fixturePath: string,
  base: string,
  locale: 'ko' | 'en',
  frontmatter: Record<string, unknown>,
  body = locale === 'ko' ? KO_BODY : EN_BODY
) {
  const suffix = locale === 'en' ? '_en' : '';
  const file = join(
    fixturePath,
    `content/dev-people/people/${base}${suffix}.md`
  );
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => {
      if (Array.isArray(v) || typeof v === 'object') {
        return `${k}: ${JSON.stringify(v)}`;
      }
      if (typeof v === 'number') {
        return `${k}: ${v}`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  writeFileSync(file, `---\n${fm}\n---\n\n${body}`, 'utf8');
}

const KNOWN_FOR_KO =
  '테스트 인물의 핵심 업적 요약으로 50자 검증을 통과하기 위해 충분히 길게 작성한 설명 문장입니다. 소프트웨어 역사에 기여했습니다.';
const KNOWN_FOR_EN =
  'A sufficiently long summary of key achievements written to pass the fifty character minimum validation rule.';

function validKoFront(overrides: Record<string, unknown> = {}) {
  return {
    name: '테스트 인물',
    slug: 'test-person',
    knownFor: KNOWN_FOR_KO,
    tags: ['python'],
    era: '2000-present',
    nationality: 'US',
    birthYear: 1970,
    ...overrides,
  };
}

function validEnFront(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Person',
    knownFor: KNOWN_FOR_EN,
    birthYear: 1970,
    ...overrides,
  };
}

interface GeneratorResult {
  exitCode: number;
  output: string;
  catalog?: { peoples: Array<Record<string, unknown>> };
}

function runGenerator(fixturePath: string): GeneratorResult {
  try {
    const cmd = `cd "${fixturePath}" && node "${join(process.cwd(), 'scripts/generate-dev-people.mjs')}"`;
    execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    const catalogPath = join(
      fixturePath,
      'src/components/tools/dev-people/data/dev-people.generated.json'
    );
    if (existsSync(catalogPath)) {
      return {
        exitCode: 0,
        output: 'Success',
        catalog: JSON.parse(readFileSync(catalogPath, 'utf8')),
      };
    }
    return { exitCode: 0, output: 'Success' };
  } catch (err: unknown) {
    const error = err as { status?: number; stderr?: Buffer; message?: string };
    return {
      exitCode: error.status || 1,
      output: (error.stderr?.toString() || error.message || '').substring(
        0,
        800
      ),
    };
  }
}

describe('dev-people generator', () => {
  afterEach(() => {
    if (existsSync(FIXTURE_BASE)) {
      rmSync(FIXTURE_BASE, { recursive: true });
    }
  });

  it('succeeds on a valid pair and preserves the markdown body in the catalog', () => {
    const fixture = createFixture('valid');
    writePerson(fixture, 'test-person', 'ko', validKoFront());
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(0);
    expect(result.catalog?.peoples).toHaveLength(1);
    const person = result.catalog!.peoples[0] as {
      slug: string;
      ko: { biography_body?: string };
      en: { biography_body?: string };
    };
    expect(person.slug).toBe('test-person');
    // regression: zod used to strip the injected body key, silently losing biographies
    expect(person.ko.biography_body).toContain('## 소개');
    expect(person.en.biography_body).toContain('## About');
  });

  it('skips `_`-prefixed template files', () => {
    const fixture = createFixture('templates');
    writePerson(fixture, 'test-person', 'ko', validKoFront());
    writePerson(fixture, 'test-person', 'en', validEnFront());
    writeFileSync(
      join(fixture, 'content/dev-people/people/_TEMPLATE.md'),
      '---\nname: x\n---\n',
      'utf8'
    );

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(0);
    expect(result.catalog?.peoples).toHaveLength(1);
  });

  it('fails when the English counterpart is missing', () => {
    const fixture = createFixture('missing-en');
    writePerson(fixture, 'test-person', 'ko', validKoFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('missing English file');
  });

  it('fails when knownFor is shorter than 50 chars', () => {
    const fixture = createFixture('short-knownfor');
    writePerson(fixture, 'test-person', 'ko', validKoFront({ knownFor: '짧음' }));
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
  });

  it('fails on a tag outside the controlled vocabulary', () => {
    const fixture = createFixture('bad-tag');
    writePerson(fixture, 'test-person', 'ko', validKoFront({ tags: ['blockchain'] }));
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
  });

  it('fails when the KO file omits structural metadata (tags/era/nationality)', () => {
    const fixture = createFixture('missing-structural');
    writePerson(
      fixture,
      'test-person',
      'ko',
      validKoFront({ tags: undefined, era: undefined, nationality: undefined })
    );
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('tag');
  });

  it('fails on dangling related references', () => {
    const fixture = createFixture('dangling-related');
    writePerson(fixture, 'test-person', 'ko', validKoFront({ related: ['ghost-person'] }));
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('ghost-person');
  });

  it('fails on non-http(s) link URLs', () => {
    const fixture = createFixture('bad-scheme');
    writePerson(
      fixture,
      'test-person',
      'ko',
      // eslint-disable-next-line no-script-url
      validKoFront({ links: [{ label: 'x', url: 'javascript:alert(1)' }] })
    );
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
  });

  it('fails when photo is declared without photoCredit or without the file', () => {
    const fixture = createFixture('photo-rules');
    writePerson(fixture, 'test-person', 'ko', validKoFront({ photo: 'test-person.jpg' }));
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('photoCredit');
  });

  it('fails when the body is a thin stub', () => {
    const fixture = createFixture('thin-body');
    writePerson(fixture, 'test-person', 'ko', validKoFront(), '## 소개\n\n짧음.');
    writePerson(fixture, 'test-person', 'en', validEnFront());

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('thin');
  });

  it('fails when achievements counts differ between locales', () => {
    const fixture = createFixture('achievements-mismatch');
    writePerson(
      fixture,
      'test-person',
      'ko',
      validKoFront({ achievements: [{ year: 2000, title: '업적' }] })
    );
    writePerson(fixture, 'test-person', 'en', validEnFront({ achievements: [] }));

    const result = runGenerator(fixture);
    expect(result.exitCode).toBe(1);
  });
});
