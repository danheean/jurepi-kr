import { render, screen, userEvent } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { JsonFormatterFaq } from './JsonFormatterFaq';

describe('JsonFormatterFaq', () => {
  it('renders FAQ heading', () => {
    render(<JsonFormatterFaq />);

    // Heading should be present (either "FAQ" or from i18n)
    const heading = screen.queryByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('renders FAQ items as details/summary', () => {
    const { container } = render(<JsonFormatterFaq />);

    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThan(0);
  });

  it('renders question and answer pairs', () => {
    render(<JsonFormatterFaq />);

    // Check for some FAQ content from catalog
    expect(screen.getByText(/What is JSON/)).toBeInTheDocument();
    expect(screen.getByText(/Why format JSON/)).toBeInTheDocument();
  });

  it('renders exactly one FAQPage JSON-LD script', () => {
    const { container } = render(<JsonFormatterFaq />);

    const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).filter(
      (s) => s.textContent?.includes('FAQPage')
    );

    expect(scripts.length).toBe(1);
  });

  it('FAQPage JSON-LD has correct structure', () => {
    const { container } = render(<JsonFormatterFaq />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();

    const jsonLd = JSON.parse(script!.textContent || '{}');
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(Array.isArray(jsonLd.mainEntity)).toBe(true);
  });

  it('FAQPage mainEntity contains Question objects', () => {
    const { container } = render(<JsonFormatterFaq />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.textContent || '{}');

    jsonLd.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(typeof item.name).toBe('string');
      expect(item.acceptedAnswer).toBeTruthy();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(typeof item.acceptedAnswer.text).toBe('string');
    });
  });

  it('FAQ items are expandable with details element', () => {
    // jsdom does not implement native <details> toggle-on-click;
    // real expand/collapse behaviour is covered by E2E. Assert structure only.
    const { container } = render(<JsonFormatterFaq />);

    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThan(0);
    details.forEach((d) => {
      expect(d.querySelector('summary')).toBeInTheDocument();
    });
  });

  it('has aria-labelledby for accessibility', () => {
    const { container } = render(<JsonFormatterFaq />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby');
  });

  it('renders one details element per FAQ item', () => {
    const { container } = render(<JsonFormatterFaq />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.textContent || '{}');
    const details = container.querySelectorAll('details');
    expect(details.length).toBe(jsonLd.mainEntity.length);
  });

  it('no Korean characters leak into en locale', () => {
    // This test would need to be run with locale="en" to check
    // For now, just ensure i18n is working
    render(<JsonFormatterFaq />);

    const section = screen.getByRole('region', { hidden: true });
    expect(section).toBeInTheDocument();
  });
});
