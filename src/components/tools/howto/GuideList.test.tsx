import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { GuideList } from './GuideList';
import type { MergedGuide } from '@/lib/howto/schema';

const mockGuide1: MergedGuide = {
  slug: 'install-claude-code',
  topic: 'setup',
  order: 1,  tags: ['claude-code', 'cli'],
  related: [],
  updated: '2026-07-06T00:00:00.000Z',
  difficulty: 'beginner',
  ko: {
    title: '클로드 코드 설치하는 법',
    summary: 'Installation guide.',
    body: 'Body...',
  },
  en: {
    title: 'How to Install Claude Code',
    summary: 'Installation guide.',
    body: 'Body...',
  },
};

const mockGuide2: MergedGuide = {
  slug: 'issue-api-token',
  topic: 'api',
  order: 1,  tags: ['api', 'token'],
  related: [],
  updated: '2026-07-06T00:00:00.000Z',
  difficulty: 'beginner',
  ko: {
    title: 'API 토큰 발급하는 법',
    summary: 'Token guide.',
    body: 'Body...',
  },
  en: {
    title: 'How to Issue an API Token',
    summary: 'Token guide.',
    body: 'Body...',
  },
};

describe('GuideList', () => {
  it('renders N cards for N guides', () => {
    const onToggleFav = vi.fn();
    const onClearQuery = vi.fn();

    render(
      <GuideList
        guides={[mockGuide1, mockGuide2]}
        favorites={[]}
        query=""
        activeTopic="all"
        onToggleFav={onToggleFav}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    expect(screen.getByTestId('guide-card-install-claude-code')).toBeInTheDocument();
    expect(screen.getByTestId('guide-card-issue-api-token')).toBeInTheDocument();
  });

  it('shows noResults message when query matches no guides', () => {
    const onClearQuery = vi.fn();

    render(
      <GuideList
        guides={[]}
        favorites={[]}
        query="nonexistent"
        activeTopic="all"
        onToggleFav={vi.fn()}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    // i18n interpolation renders as "No guides match {query}" with {query} interpolated
    expect(screen.getByText(/No guides match/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('calls onClearQuery when Clear button is clicked', async () => {
    const onClearQuery = vi.fn();

    render(
      <GuideList
        guides={[]}
        favorites={[]}
        query="search term"
        activeTopic="all"
        onToggleFav={vi.fn()}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    await userEvent.click(clearBtn);

    expect(onClearQuery).toHaveBeenCalled();
  });

  it('shows noFavorites message when favorites tab is empty', () => {
    const onClearQuery = vi.fn();

    render(
      <GuideList
        guides={[]}
        favorites={[]}
        query=""
        activeTopic="favorites"
        onToggleFav={vi.fn()}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    expect(
      screen.getByText('Tap the star to save guides you use often')
    ).toBeInTheDocument();
  });

  it('shows noRecent message when recent tab is empty', () => {
    const onClearQuery = vi.fn();

    render(
      <GuideList
        guides={[]}
        favorites={[]}
        query=""
        activeTopic="recent"
        onToggleFav={vi.fn()}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    expect(
      screen.getByText("Guides you've read appear here")
    ).toBeInTheDocument();
  });

  it('marks guides as favorites when slug is in favorites array', () => {
    render(
      <GuideList
        guides={[mockGuide1, mockGuide2]}
        favorites={['install-claude-code']}
        query=""
        activeTopic="all"
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const star1 = screen.getByTestId('guide-star-install-claude-code');
    const star2 = screen.getByTestId('guide-star-issue-api-token');

    expect(star1).toHaveAttribute('aria-pressed', 'true');
    expect(star2).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggleFav when favorite star is clicked on any card', async () => {
    const onToggleFav = vi.fn();

    render(
      <GuideList
        guides={[mockGuide1, mockGuide2]}
        favorites={[]}
        query=""
        activeTopic="all"
        onToggleFav={onToggleFav}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />,
      { locale: 'en' }
    );

    const star2 = screen.getByTestId('guide-star-issue-api-token');
    await userEvent.click(star2);

    expect(onToggleFav).toHaveBeenCalledWith('issue-api-token');
  });

  it('renders guides in Korean locale', () => {
    render(
      <GuideList
        guides={[mockGuide1]}
        favorites={[]}
        query=""
        activeTopic="all"
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="ko"
      />,
      { locale: 'ko' }
    );

    expect(screen.getByText('클로드 코드 설치하는 법')).toBeInTheDocument();
  });
});
