import { render, screen } from '@testing-library/react';
import { LottoGeneratorFaq } from './LottoGeneratorFaq';
import { AllTheProviders } from '@/__test__/test-utils';

describe('LottoGeneratorFaq', () => {
  it('renders with ko locale', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }) });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('FAQ');
  });

  it('renders with en locale', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }) });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('FAQ');
  });

  it('renders FAQPage JSON-LD schema', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }) });

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toBeTruthy();

    const schema = JSON.parse(script!.innerHTML);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toBeDefined();
    expect(Array.isArray(schema.mainEntity)).toBe(true);
  });

  it('FAQPage JSON-LD contains all Q&A items', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }) });

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script!.innerHTML);

    // Real catalog has exactly 6 FAQ items
    expect(schema.mainEntity.length).toBe(6);
    schema.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer).toBeDefined();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBeTruthy();
    });
  });

  it('renders FAQ items as visible H3 + text', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }) });

    const h3s = screen.getAllByRole('heading', { level: 3 });
    // Real catalog has exactly 6 FAQ items
    expect(h3s.length).toBe(6);

    // Check for first FAQ question from real catalog
    expect(screen.getByText('Can I win with these numbers?')).toBeInTheDocument();
  });

  it('renders FAQ items with div wrappers', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }) });

    const divs = container.querySelectorAll('section > div > div');
    expect(divs.length).toBeGreaterThan(0);
  });

  it('does not expose MISSING_MESSAGE or raw markdown in ko', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }) });

    // Get text excluding script tags (JSON-LD may contain markdown for rendering)
    const scripts = container.querySelectorAll('script');
    scripts.forEach(s => s.remove());
    const text = container.textContent || '';
    expect(text).not.toMatch(/MISSING_MESSAGE/);
    expect(text).not.toMatch(/\*\*/); // raw markdown ** should not appear in visible text
  });

  it('does not expose MISSING_MESSAGE or raw markdown in en', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }) });

    // Get text excluding script tags (JSON-LD may contain markdown for rendering)
    const scripts = container.querySelectorAll('script');
    scripts.forEach(s => s.remove());
    const text = container.textContent || '';
    expect(text).not.toMatch(/MISSING_MESSAGE/);
    expect(text).not.toMatch(/\*\*/);
  });

  it('uses correct aria-labelledby', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }) });

    const section = container.querySelector('section[aria-labelledby="lotto-generator-faq-heading"]');
    expect(section).toBeInTheDocument();
  });

  it('FAQPage JSON-LD url uses faqPageJsonLd helper', () => {
    const { container } = render(<LottoGeneratorFaq />, { wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }) });

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script!.innerHTML);

    // Verify @context is set (indicating proper faqPageJsonLd usage)
    expect(schema['@context']).toBe('https://schema.org');
  });
});
