import { render } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { Base64EncoderFaq } from './Base64EncoderFaq';
import { Base64EncoderStructuredData } from './Base64EncoderStructuredData';
import { getToolBySlug } from '@/tools/registry';

describe('Base64EncoderSeo', () => {
  describe('Base64EncoderFaq', () => {
    it('renders FAQPage JSON-LD script', () => {
      const { container } = render(<Base64EncoderFaq />);

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    it('FAQPage JSON-LD is valid JSON', () => {
      const { container } = render(<Base64EncoderFaq />);

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const faqScript = Array.from(scripts).find((s) => {
        try {
          const data = JSON.parse(s.textContent || '{}');
          return data['@type'] === 'FAQPage';
        } catch {
          return false;
        }
      });

      expect(faqScript).toBeDefined();
      const parsed = JSON.parse(faqScript?.textContent || '{}');
      expect(parsed['@type']).toBe('FAQPage');
      expect(Array.isArray(parsed.mainEntity)).toBe(true);
    });

    it('FAQPage contains 5 question-answer pairs', () => {
      const { container } = render(<Base64EncoderFaq />);

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const faqScript = Array.from(scripts).find((s) => {
        try {
          const data = JSON.parse(s.textContent || '{}');
          return data['@type'] === 'FAQPage';
        } catch {
          return false;
        }
      });

      const parsed = JSON.parse(faqScript?.textContent || '{}');
      expect(parsed.mainEntity).toHaveLength(5);

      // Each mainEntity should have Question structure with name and acceptedAnswer
      parsed.mainEntity.forEach((item: any) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('acceptedAnswer');
        expect(item.acceptedAnswer).toHaveProperty('text');
      });
    });

    it('FAQ section is rendered outside mounting gate for SSR', () => {
      const { container } = render(<Base64EncoderFaq />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Base64EncoderStructuredData', () => {
    it('renders SoftwareApplication JSON-LD script', () => {
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
    });

    it('SoftwareApplication JSON-LD is valid and complete', () => {
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
      expect(typeof parsed.name).toBe('string');
      expect(parsed.url).toBeDefined();
      expect(typeof parsed.url).toBe('string');
    });

    it('SoftwareApplication does NOT contain FAQPage (single ownership)', () => {
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
      expect(parsed['@type']).not.toBe('FAQPage');
      expect(parsed.mainEntity).toBeUndefined();
    });

    it('SoftwareApplication URL uses canonical format', () => {
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
      // URL should reference the tool via canonical domain
      expect(parsed.url).toMatch(/base64-encoder/);
    });

    it('retrieves tool metadata from registry', () => {
      // Verify getToolBySlug works for base64-encoder
      const tool = getToolBySlug('base64-encoder');
      expect(tool).toBeDefined();
      expect(tool?.slug).toBe('base64-encoder');
    });
  });
});
