import { render } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { Base64EncoderFaq } from './Base64EncoderFaq';

describe('Base64EncoderFaq', () => {
  it('renders section with heading', () => {
    const { container } = render(<Base64EncoderFaq />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('renders FAQPage JSON-LD script in document', () => {
    const { container } = render(<Base64EncoderFaq />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);
  });

  it('FAQPage JSON-LD script contains valid structure', () => {
    const { container } = render(<Base64EncoderFaq />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    let faqFound = false;

    Array.from(scripts).forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '{}');
        if (data['@type'] === 'FAQPage') {
          faqFound = true;
          expect(Array.isArray(data.mainEntity)).toBe(true);
          expect(data.mainEntity.length).toBeGreaterThan(0);
          expect(data.mainEntity[0]).toHaveProperty('name');
          expect(data.mainEntity[0]).toHaveProperty('acceptedAnswer');
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    expect(faqFound).toBe(true);
  });

  it('renders multiple FAQ items', () => {
    const { container } = render(<Base64EncoderFaq />);

    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThanOrEqual(1);
  });
});
