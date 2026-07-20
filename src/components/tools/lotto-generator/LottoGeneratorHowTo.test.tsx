import { render, screen } from '@testing-library/react';
import { LottoGeneratorHowTo } from './LottoGeneratorHowTo';
import { AllTheProviders } from '@/__test__/test-utils';

describe('LottoGeneratorHowTo', () => {
  it('renders with ko locale', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }),
    });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('How to Use');
  });

  it('renders with en locale', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
    });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('How to Use');
  });

  it('renders all howTo items with titles and descriptions', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
    });

    const h3s = screen.getAllByRole('heading', { level: 3 });
    // Real catalog has exactly 2 howTo items
    expect(h3s.length).toBe(2);

    // Check for items rendered from real catalog
    expect(screen.getByText('Generate in 3 Steps')).toBeInTheDocument();
    expect(screen.getByText('Cryptographically Secure Randomness')).toBeInTheDocument();
  });

  it('renders items with article elements', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }),
    });

    const articles = container.querySelectorAll('article');
    expect(articles.length).toBeGreaterThan(0);
  });

  it('does not expose MISSING_MESSAGE or raw markdown in ko', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }),
    });

    const text = container.textContent || '';
    expect(text).not.toMatch(/MISSING_MESSAGE/);
    expect(text).not.toMatch(/\*\*/); // raw markdown ** should not appear
  });

  it('does not expose MISSING_MESSAGE or raw markdown in en', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
    });

    const text = container.textContent || '';
    expect(text).not.toMatch(/MISSING_MESSAGE/);
    expect(text).not.toMatch(/\*\*/);
  });

  it('uses correct aria-labelledby', () => {
    const { container } = render(<LottoGeneratorHowTo />, {
      wrapper: ({ children }) => AllTheProviders({ children, locale: 'ko' }),
    });

    const section = container.querySelector('section[aria-labelledby="lotto-generator-howto-heading"]');
    expect(section).toBeInTheDocument();
  });
});
