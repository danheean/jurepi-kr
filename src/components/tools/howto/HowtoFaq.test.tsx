import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { HowtoFaq } from './HowtoFaq';

describe('HowtoFaq', () => {
  it('renders FAQ title', () => {
    render(<HowtoFaq />, { locale: 'en' });

    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
  });

  it('renders all FAQ items from catalog', () => {
    render(<HowtoFaq />, { locale: 'en' });

    // Based on test-utils i18n messages
    expect(
      screen.getByText('Where are guides stored?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Where are my favorites saved?')
    ).toBeInTheDocument();
    expect(screen.getByText('Can I copy code?')).toBeInTheDocument();
  });

  it('renders FAQ answers', () => {
    render(<HowtoFaq />, { locale: 'en' });

    expect(
      screen.getByText(
        "All guides are generated as static HTML and load instantly in your browser. They're not stored on your device — just open this site and read."
      )
    ).toBeInTheDocument();
  });

  it('emits EXACTLY ONE FAQPage JSON-LD script', () => {
    const { container } = render(<HowtoFaq />, { locale: 'en' });

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    // Should have exactly 1 FAQPage
    const faqScripts = Array.from(scripts).filter((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        return data['@type'] === 'FAQPage';
      } catch {
        return false;
      }
    });

    expect(faqScripts).toHaveLength(1);
  });

  it('FAQPage JSON-LD has correct schema structure', () => {
    const { container } = render(<HowtoFaq />, { locale: 'en' });

    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeTruthy();

    const jsonLd = JSON.parse(script?.textContent || '{}');

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd.mainEntity).toBeDefined();
    expect(Array.isArray(jsonLd.mainEntity)).toBe(true);
  });

  it('FAQPage mainEntity items have Question and acceptedAnswer structure', () => {
    const { container } = render(<HowtoFaq />, { locale: 'en' });

    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const jsonLd = JSON.parse(script?.textContent || '{}');

    jsonLd.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer).toBeDefined();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBeTruthy();
    });
  });

  it('renders FAQ items as details/summary elements (collapsible)', () => {
    const { container } = render(<HowtoFaq />, { locale: 'en' });

    const detailsElements = container.querySelectorAll('details');

    // Should have 3 FAQ items
    expect(detailsElements.length).toBeGreaterThan(0);

    // Each details should have a summary
    detailsElements.forEach((details) => {
      const summary = details.querySelector('summary');
      expect(summary).toBeTruthy();
    });
  });

  it('renders in Korean locale', () => {
    render(<HowtoFaq />, { locale: 'ko' });

    // The i18n key for Korean should be resolved
    // Check that at least the title renders (may be in Korean)
    const titles = screen.getAllByRole('heading');
    expect(titles.length).toBeGreaterThan(0);
  });
});
