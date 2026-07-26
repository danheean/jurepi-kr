import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/__test__/test-utils';
import { TermDetail } from './TermDetail';
import type { MergedTerm } from '@/lib/new-word/schema';

const mockCatalog: MergedTerm[] = [
  {
    slug: 'god-life',
    topic: 'mz',
    related: ['vibe-coding'],
    coinedYear: 2020,
    ko: {
      term: '신의 삶',
      definition: '이상적인 삶',
      examples: ['예시1', '예시2'],
      body: 'An **ideal** life where `everything` works out.',
      origin: '영어에서 유래',
      reading: 'sin-ui sal',
      tags: ['lifestyle', 'aspirational'],
    },
    en: {
      term: 'god life',
      definition: 'An ideal life where everything works out perfectly.',
      examples: ['Living a god life means no stress', 'Example 2'],
      body: 'Perfect harmony. This is **bold** and `inline code`.',
      origin: 'English origin',
      reading: 'gahd life',
      tags: ['lifestyle', 'aspirational'],
    },
  },
  {
    slug: 'vibe-coding',
    topic: 'tech',
    related: [],
    ko: {
      term: '기분 코딩',
      definition: '직관적 코딩',
      examples: ['예시'],
      body: '',
      tags: ['programming'],
    },
    en: {
      term: 'vibe coding',
      definition: 'Programming by intuition',
      examples: ['Example'],
      body: '',
      tags: ['programming'],
    },
  },
];

describe('TermDetail', () => {
  it('renders empty hint when term is null', () => {
    render(
      <TermDetail
        term={null}
        displayLang="both"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('Select a term')).toBeInTheDocument();
  });

  it('renders term heading with current locale', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="both"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('god life')).toBeInTheDocument();
  });

  it('renders definition section', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('Definition')).toBeInTheDocument();
    expect(screen.getByText(/ideal life where everything/)).toBeInTheDocument();
  });

  it('renders examples', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('Examples')).toBeInTheDocument();
    // The example is rendered in a list
    const examples = screen.getAllByRole('listitem');
    expect(examples.length).toBeGreaterThan(0);
  });

  it('renders origin when present', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('Origin')).toBeInTheDocument();
    expect(screen.getByText('English origin')).toBeInTheDocument();
  });

  it('renders markdown body with bold, code, and other markdown', () => {
    const { container } = render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('bold');

    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
  });

  it('displays language toggle buttons', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="both"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByTestId('lang-toggle-ko')).toBeInTheDocument();
    expect(screen.getByTestId('lang-toggle-en')).toBeInTheDocument();
    expect(screen.getByTestId('lang-toggle-both')).toBeInTheDocument();
  });

  it('calls setDisplayLang when language button is clicked', async () => {
    const setDisplayLang = vi.fn();
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={setDisplayLang}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    const koBtn = screen.getByTestId('lang-toggle-ko');
    await userEvent.click(koBtn);

    expect(setDisplayLang).toHaveBeenCalledWith('ko');
  });

  it('displays topic badge', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('MZ')).toBeInTheDocument();
  });

  it('displays coined year when present', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  it('displays tags', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('lifestyle')).toBeInTheDocument();
    expect(screen.getByText('aspirational')).toBeInTheDocument();
  });

  it('displays copy buttons', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByTestId('copy-term')).toBeInTheDocument();
    expect(screen.getByTestId('copy-definition')).toBeInTheDocument();
  });

  it('calls onCopy when copy term button is clicked', async () => {
    const onCopy = vi.fn().mockResolvedValue(true);
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={onCopy}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    const copyBtn = screen.getByTestId('copy-term');
    await userEvent.click(copyBtn);

    expect(onCopy).toHaveBeenCalledWith('god life');
  });

  it('displays close button', async () => {
    const onClose = vi.fn();
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={onClose}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    const closeBtn = screen.getByTestId('term-detail-close');
    await userEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows both languages when displayLang is "both"', () => {
    const { container } = render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="both"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    // The "both" button should have the brand background color when displayLang is "both"
    const bothButton = screen.getByTestId('lang-toggle-both');
    expect(bothButton).toHaveClass('bg-brand');

    // Both Definition labels should be visible
    const definitionLabels = screen.getAllByText('Definition');
    expect(definitionLabels.length).toBe(2); // One for Korean, one for English
  });

  it('shows only korean when displayLang is "ko"', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="ko"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="ko"
      />
    );

    expect(screen.getByText('신의 삶')).toBeInTheDocument();
    expect(screen.queryByText(/god life example/)).not.toBeInTheDocument();
  });

  it('renders related chips section when related terms exist', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('Related Terms')).toBeInTheDocument();
    expect(screen.getByText('vibe coding')).toBeInTheDocument();
  });

  it('calls onSelect when related chip is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={onSelect}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    const relatedChip = screen.getByTestId('related-chip-vibe-coding');
    await userEvent.click(relatedChip);

    expect(onSelect).toHaveBeenCalledWith('vibe-coding');
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={onClose}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    const panel = container.querySelector('[data-testid="term-detail"]');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders reading/pronunciation when present', () => {
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    expect(screen.getByText('gahd life')).toBeInTheDocument();
  });

  it('cycles through language with Ctrl+L', async () => {
    const setDisplayLang = vi.fn();
    const { container } = render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="ko"
        setDisplayLang={setDisplayLang}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(setDisplayLang).toHaveBeenCalledWith('en');
  });

  it('cycles language from en to both with Ctrl+L', async () => {
    const setDisplayLang = vi.fn();
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="en"
        setDisplayLang={setDisplayLang}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(setDisplayLang).toHaveBeenCalledWith('both');
  });

  it('cycles language from both to ko with Ctrl+L', async () => {
    const setDisplayLang = vi.fn();
    render(
      <TermDetail
        term={mockCatalog[0]}
        displayLang="both"
        setDisplayLang={setDisplayLang}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={mockCatalog}
        currentLocale="en"
      />
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(setDisplayLang).toHaveBeenCalledWith('ko');
  });
});

describe('TermDetail — share button integration', () => {
  beforeEach(() => {
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
    }
  });

  const shareTerm: MergedTerm = {
    slug: 'god-saeng',
    topic: 'mz',
    related: [],
    ko: {
      term: '갓생',
      definition: '제대로 된 삶, 멋진 인생',
      examples: ['그는 정말 갓생을 산다.'],
      body: '',
      tags: ['lifestyle'],
    },
    en: {
      term: 'God Saeng',
      definition: 'A proper, exemplary life; living your best life',
      examples: ['She is living her best god saeng.'],
      body: '',
      tags: ['lifestyle'],
    },
  };

  const renderShare = (term: MergedTerm | null, currentLocale: 'ko' | 'en') =>
    render(
      <TermDetail
        term={term}
        displayLang={currentLocale}
        setDisplayLang={vi.fn()}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onCopy={vi.fn()}
        catalog={term ? [term] : []}
        currentLocale={currentLocale}
      />
    );

  it.each(['ko', 'en'] as const)(
    'renders share row and copies the spoke absolute URL, not the hub URL (%s)',
    async (locale) => {
      const writeTextSpy = vi
        .spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValue(undefined);

      renderShare(shareTerm, locale);

      const copyBtn = screen.getByTestId('share-button-copy');
      expect(copyBtn).toBeInTheDocument();
      copyBtn.click();

      await waitFor(() => {
        expect(writeTextSpy).toHaveBeenCalledWith(
          `https://jurepi.kr/${locale}/tools/new-word/${shareTerm.slug}`
        );
      });
      writeTextSpy.mockRestore();
    }
  );

  it('does not render share buttons when term is null', () => {
    renderShare(null, 'ko');
    expect(screen.queryByTestId('share-button-copy')).not.toBeInTheDocument();
  });
});
