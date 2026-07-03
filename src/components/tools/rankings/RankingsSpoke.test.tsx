import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { RankingsSpoke } from './RankingsSpoke';
import type { MergedRanking } from '@/lib/rankings/schema';
import rankingsData from './data/rankings.generated.json';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const CATALOG = rankingsData as MergedRanking[];
const tiobe = CATALOG.find((r) => r.slug === 'tiobe-programming-languages')!;

// next-intl's messages prop rejects the full catalog's inferred type; sibling
// tests cast with `as any` for the same reason.
function renderKo(ranking: MergedRanking) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <RankingsSpoke ranking={ranking} locale="ko" />
    </NextIntlClientProvider>
  );
}

function renderEn(ranking: MergedRanking) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <RankingsSpoke ranking={ranking} locale="en" />
    </NextIntlClientProvider>
  );
}

describe('RankingsSpoke', () => {
  it('renders a breadcrumb: home › rankings hub › ranking title', () => {
    renderKo(tiobe);
    const breadcrumb = screen.getByTestId('rankings-spoke-breadcrumb');
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb).toHaveTextContent('홈');
    expect(breadcrumb).toHaveTextContent(tiobe.ko.title);
    // Home + hub links carry the locale prefix.
    const homeLink = breadcrumb.querySelector('a[href="/ko"]');
    const hubLink = breadcrumb.querySelector('a[href="/ko/tools/rankings"]');
    expect(homeLink).toBeInTheDocument();
    expect(hubLink).toBeInTheDocument();
  });

  it('renders the ranking title as the H1', () => {
    renderKo(tiobe);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(tiobe.ko.title);
  });

  it('renders the provenance source note (outside any gate)', () => {
    renderKo(tiobe);
    expect(screen.getByText(tiobe.ko.sourceNote)).toBeInTheDocument();
  });

  it('renders the full ranking table with item names', () => {
    renderKo(tiobe);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    // Every item name is present in the SSR table.
    for (const item of tiobe.ko.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
  });

  it('renders a back-to-hub link', () => {
    renderKo(tiobe);
    const back = screen.getByTestId('rankings-spoke-back-to-hub');
    expect(back).toHaveAttribute('href', '/ko/tools/rankings');
  });

  it('renders English content for the en locale', () => {
    renderEn(tiobe);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(tiobe.en.title);
    expect(
      screen.getByTestId('rankings-spoke-back-to-hub')
    ).toHaveAttribute('href', '/en/tools/rankings');
  });
});
