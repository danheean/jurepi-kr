import { render } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Base64EncoderStructuredData } from './Base64EncoderStructuredData';

describe('Base64EncoderStructuredData', () => {
  beforeEach(() => {
    // Production canonical origin — seo.absoluteToolUrl reads this env at call time
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://apps.jurepi.kr');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders SoftwareApplication JSON-LD script', () => {
    const { container } = render(<Base64EncoderStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);
  });

  it('SoftwareApplication JSON-LD is valid JSON', () => {
    const { container } = render(<Base64EncoderStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const appScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '{}');
        return data['@type'] === 'SoftwareApplication';
      } catch {
        return false;
      }
    });

    expect(appScript).toBeDefined();
    const parsed = JSON.parse(appScript?.textContent || '{}');
    expect(parsed['@type']).toBe('SoftwareApplication');
    expect(parsed.name).toBeDefined();
    expect(parsed.url).toBeDefined();
  });

  it('SoftwareApplication does NOT include FAQPage (single ownership)', () => {
    const { container } = render(<Base64EncoderStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const appScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '{}');
        return data['@type'] === 'SoftwareApplication';
      } catch {
        return false;
      }
    });

    const parsed = JSON.parse(appScript?.textContent || '{}');
    expect(parsed.mainEntity).toBeUndefined();
    expect(parsed['@type']).not.toBe('FAQPage');
  });

  it('url uses canonical format (apps.jurepi.kr)', () => {
    const { container } = render(<Base64EncoderStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const appScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '{}');
        return data['@type'] === 'SoftwareApplication';
      } catch {
        return false;
      }
    });

    const parsed = JSON.parse(appScript?.textContent || '{}');
    expect(parsed.url).toMatch(/apps\.jurepi\.kr.*base64-encoder/);
  });
});
