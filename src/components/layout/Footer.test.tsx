import { render, screen, within } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Footer } from './Footer';

// Mock the tools registry
vi.mock('@/tools/registry', () => ({
  tools: [
    {
      id: 'ladder',
      slug: 'ladder',
      category: 'random',
      icon: 'ListTree',
      accent: 'coral',
      status: 'live',
      isNew: true,
      isPopular: true,
      order: 1,
      keywords: [],
    },
    {
      id: 'qna-a-day',
      slug: 'qna-a-day',
      category: 'mindset',
      icon: 'NotebookPen',
      accent: 'grape',
      status: 'live',
      isNew: true,
      order: 2,
      keywords: [],
    },
    // Empty category examples
    {
      id: 'placeholder-calculator',
      slug: 'placeholder-calculator',
      category: 'calculator',
      icon: 'Calculator',
      accent: 'sun',
      status: 'coming_soon',
      order: 3,
      keywords: [],
    },
  ],
}));

// Mock next-intl/server since Footer is an async Server Component
// In real E2E tests, actual translations are used
vi.mock('next-intl/server', async () => {
  const actual = await vi.importActual('next-intl/server');
  return {
    ...actual,
    getTranslations: () => (key: string) => {
      const translations: Record<string, string> = {
        'footer.about': 'About',
        'footer.privacy': 'Privacy',
        'footer.terms': 'Terms',
        'footer.contact': 'Contact',
        'footer.copyright': '© 2026 Jurepi · All tools are free.',
        'categories.random': 'Random',
        'categories.calculator': 'Calculator',
        'categories.text': 'Text',
        'categories.converter': 'Converter',
        'categories.fun': 'Fun',
        'categories.mindset': 'Mindset',
        'tools.ladder.title': 'Ladder Game',
        'tools.ladder.description': 'Play the ladder game',
        'tools.qna-a-day.title': 'Q&A a Day',
        'tools.qna-a-day.description': 'Daily question journal',
      };
      return translations[key] || key;
    },
  };
});

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 6 category headings', async () => {
    const { container } = render(await Footer());
    const headings = container.querySelectorAll('footer h3');
    expect(headings).toHaveLength(6);
  });

  it('renders ladder link under random category', async () => {
    const { container } = render(await Footer());
    const randomSection = Array.from(container.querySelectorAll('h3')).find(
      (h) => h.textContent?.includes('Random')
    );
    if (randomSection) {
      const link = within(randomSection.parentElement!).queryByRole('link', {
        name: /Ladder Game/i,
      });
      expect(link).toBeInTheDocument();
    }
  });

  it('renders qna-a-day link under mindset category', async () => {
    const { container } = render(await Footer());
    const mindsetSection = Array.from(container.querySelectorAll('h3')).find(
      (h) => h.textContent?.includes('Mindset')
    );
    if (mindsetSection) {
      const link = within(mindsetSection.parentElement!).queryByRole('link', {
        name: /Q&A a Day/i,
      });
      expect(link).toBeInTheDocument();
    }
  });

  it('renders empty categories with heading but no tool links', async () => {
    const { container } = render(await Footer());
    // Calculator should be empty (only coming_soon tool)
    const calculatorSection = Array.from(
      container.querySelectorAll('h3')
    ).find((h) => h.textContent?.includes('Calculator'));
    if (calculatorSection) {
      const parent = calculatorSection.parentElement!;
      const links = within(parent).queryAllByRole('link');
      expect(links).toHaveLength(0);
    }
  });

  it('does not render tagline', async () => {
    const { container } = render(await Footer());
    // Verify the tagline "Handy tools, all free." is not present in footer
    // (it was removed, only copyright remains)
    const footer = container.querySelector('footer');
    const footerText = footer?.textContent || '';
    expect(footerText).not.toContain('Handy tools, all free.');
  });

  it('renders 4 legal links', async () => {
    const { container } = render(await Footer());
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    const legalLinks = Array.from(
      footer!.querySelectorAll('a[href*="/about"], a[href*="/privacy"], a[href*="/terms"], a[href*="/contact"]')
    );
    expect(legalLinks.length).toBeGreaterThanOrEqual(4);
  });

  it('renders copyright text', async () => {
    const { container } = render(await Footer());
    const copyright = Array.from(container.querySelectorAll('*')).find(
      (el) =>
        el.textContent?.includes('© 2026 Jurepi') &&
        el.textContent?.includes('All tools are free.')
    );
    expect(copyright).toBeInTheDocument();
  });
});
