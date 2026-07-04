import { describe, it, expect } from 'vitest';
import { render } from '@/__test__/test-utils';
import { CounterFaq } from './CounterFaq';

describe('CounterFaq', () => {
  it('renders FAQ section heading', () => {
    const { container } = render(<CounterFaq />);

    const heading = container.querySelector('h2');
    expect(heading).toHaveTextContent('FAQ');
  });

  it('renders FAQ items from i18n', () => {
    const { container } = render(<CounterFaq />);

    // Check that FAQ items are rendered
    const h3s = container.querySelectorAll('h3');
    expect(h3s.length).toBeGreaterThan(0);
  });

  it('emits FAQPage JSON-LD script', () => {
    const { container } = render(<CounterFaq />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    // Parse JSON-LD to validate it's valid JSON
    const jsonLd = JSON.parse(script?.textContent || '{}');
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(Array.isArray(jsonLd.mainEntity)).toBe(true);
  });

  it('FAQPage JSON-LD includes questions and answers', () => {
    const { container } = render(<CounterFaq />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script?.textContent || '{}');

    // Should have multiple Q&A items
    expect(jsonLd.mainEntity.length).toBeGreaterThan(0);

    // Each item should be a Question type with name and acceptedAnswer
    jsonLd.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeDefined();
      expect(item.acceptedAnswer).toBeDefined();
      expect(item.acceptedAnswer.text).toBeDefined();
    });
  });

  it('section is semantically marked with aria-labelledby', () => {
    const { container } = render(<CounterFaq />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'counter-faq-heading');

    const heading = container.querySelector('h2#counter-faq-heading');
    expect(heading).toBeInTheDocument();
  });
});
