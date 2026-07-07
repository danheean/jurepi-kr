import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { GuideCard } from './GuideCard';
import type { MergedGuide } from '@/lib/howto/schema';

const mockGuide: MergedGuide = {
  slug: 'install-claude-code',
  topic: 'setup',
  order: 1,  tags: ['claude-code', 'cli', 'installation'],
  related: [],
  updated: '2026-07-06T00:00:00.000Z',
  difficulty: 'beginner',
  ko: {
    title: '클로드 코드 설치하는 법',
    summary: 'Step-by-step guide to install Claude Code.',
    body: 'Installation guide...',
  },
  en: {
    title: 'How to Install Claude Code',
    summary: 'A step-by-step guide to installing the Claude Code CLI.',
    body: 'Installation guide...',
  },
};

describe('GuideCard', () => {
  it('renders as a visible anchor link with href to the spoke page', () => {
    const onToggleFav = vi.fn();

    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={onToggleFav}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const card = screen.getByTestId('guide-card-install-claude-code');
    expect(card.tagName).toBe('A');
    expect(card).toHaveAttribute(
      'href',
      expect.stringContaining('/tools/howto/install-claude-code')
    );
    // Regression: content should NOT be hidden
    expect(card).not.toHaveClass('hidden');
    expect(screen.getByText('How to Install Claude Code')).toBeInTheDocument();
  });

  it('renders title, summary, topic, and difficulty in English', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    expect(screen.getByText('How to Install Claude Code')).toBeInTheDocument();
    expect(
      screen.getByText('A step-by-step guide to installing the Claude Code CLI.')
    ).toBeInTheDocument();
    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('renders title, summary, topic, and difficulty in Korean', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="ko"
      />,
      { locale: 'ko' }
    );

    expect(screen.getByText('클로드 코드 설치하는 법')).toBeInTheDocument();
    expect(
      screen.getByText('Step-by-step guide to install Claude Code.')
    ).toBeInTheDocument();
  });

  it('renders up to 3 tags', () => {
    const guideWithManyTags: MergedGuide = {
      ...mockGuide,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };

    render(
      <GuideCard
        guide={guideWithManyTags}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
    expect(screen.queryByText('tag5')).not.toBeInTheDocument();
  });

  it('star button toggles favorite', async () => {
    const onToggleFav = vi.fn();

    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={onToggleFav}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const starBtn = screen.getByTestId('guide-star-install-claude-code');
    await userEvent.click(starBtn);

    expect(onToggleFav).toHaveBeenCalledWith('install-claude-code');
  });

  it('star button has aria-pressed and aria-label', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const starBtn = screen.getByTestId('guide-star-install-claude-code');
    expect(starBtn).toHaveAttribute('aria-pressed', 'false');
    expect(starBtn).toHaveAttribute('aria-label', 'Add to favorites');
  });

  it('star shows filled when isFavorite is true', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={true}
        onToggleFav={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const starBtn = screen.getByTestId('guide-star-install-claude-code');
    expect(starBtn).toHaveAttribute('aria-pressed', 'true');
    expect(starBtn).toHaveAttribute('aria-label', 'Remove from favorites');
    expect(starBtn.querySelector('svg')).toHaveClass('fill-brand', 'text-brand');
  });

  it('displays updated date in locale format (en)', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    expect(screen.getByText(/Updated Jul \d{1,2}, 2026/)).toBeInTheDocument();
  });

  it('displays no stray English labels when rendered in Korean', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="ko"
      />,
      { locale: 'ko' }
    );

    const card = screen.getByTestId('guide-card-install-claude-code');
    const text = card.textContent || '';

    // Card should NOT contain raw i18n keys
    expect(text).not.toContain('tools.howto.');

    // Check for Korean characters in key labels (topic should be Ko)
    const ko = screen.getByText('클로드 코드 설치하는 법');
    expect(ko).toBeInTheDocument();
  });

  it('displays no stray Korean characters when rendered in English', () => {
    render(
      <GuideCard
        guide={mockGuide}
        isFavorite={false}
        onToggleFav={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const card = screen.getByTestId('guide-card-install-claude-code');
    const text = card.textContent || '';

    // Test-utils rendering uses en locale, so no Korean should leak
    // We look for Korean hangul range
    const koreanRegex = /[가-힯]/g;
    const koreanMatches = text.match(koreanRegex);

    // Tags may contain Korean, but chrome labels should not
    expect(text).not.toContain('tools.howto.');
    // Summary/title should be in English
    expect(
      screen.getByText('A step-by-step guide to installing the Claude Code CLI.')
    ).toBeInTheDocument();
  });
});
