import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { ToolIntro } from './ToolIntro';

function renderIntro(props?: Partial<React.ComponentProps<typeof ToolIntro>>) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages as never}>
      <ToolIntro
        slug="restaurant-map"
        eyebrow="맛집 도구"
        title="맛집 리스트"
        description="큐레이터가 직접 다녀온 동네 맛집을 발견하세요."
        accent="rose"
        {...props}
      />
    </NextIntlClientProvider>
  );
}

describe('ToolIntro', () => {
  it('renders the title as the page H1', () => {
    renderIntro();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('맛집 리스트');
    // Uniform branded display heading across all tools.
    expect(h1).toHaveClass('font-display', 'text-display-lg');
  });

  it('renders the eyebrow and description', () => {
    renderIntro();
    expect(screen.getByText('맛집 도구')).toBeInTheDocument();
    expect(
      screen.getByText('큐레이터가 직접 다녀온 동네 맛집을 발견하세요.')
    ).toBeInTheDocument();
  });

  it('colors the eyebrow with the category accent -ink token', () => {
    renderIntro({ accent: 'rose' });
    expect(screen.getByText('맛집 도구')).toHaveClass('text-accent-rose-ink');
  });

  it('uses a different accent class for a different category', () => {
    renderIntro({ accent: 'grape', eyebrow: '매일의 기록' });
    expect(screen.getByText('매일의 기록')).toHaveClass('text-accent-grape-ink');
  });

  it('renders the slug-derived tool avatar', () => {
    renderIntro({ slug: 'qna-a-day' });
    const img = screen.getByRole('img');
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(
      '/characters/qna-a-day.webp'
    );
  });
});
