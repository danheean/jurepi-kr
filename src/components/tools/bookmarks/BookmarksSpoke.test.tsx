import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { BookmarksSpoke } from './BookmarksSpoke';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import bookmarksData from './data/bookmarks.generated.json';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const CATALOG = bookmarksData as MergedTopic[];
const egovframe = CATALOG.find((t) => t.slug === 'egovframe-standard')!;

// next-intl's messages prop rejects the full catalog's inferred type; sibling
// tests cast with `as any` for the same reason.
function renderKo(topic: MergedTopic) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <BookmarksSpoke topic={topic} locale="ko" />
    </NextIntlClientProvider>
  );
}

function renderEn(topic: MergedTopic) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <BookmarksSpoke topic={topic} locale="en" />
    </NextIntlClientProvider>
  );
}

describe('BookmarksSpoke', () => {
  it('renders a breadcrumb: home › bookmarks hub › topic title', () => {
    renderKo(egovframe);
    const breadcrumb = screen.getByTestId('bookmarks-spoke-breadcrumb');
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb).toHaveTextContent('홈');
    expect(breadcrumb).toHaveTextContent(egovframe.ko.title);
    // Home + hub links carry the locale prefix.
    const homeLink = breadcrumb.querySelector('a[href="/ko"]');
    const hubLink = breadcrumb.querySelector('a[href="/ko/tools/bookmarks"]');
    expect(homeLink).toBeInTheDocument();
    expect(hubLink).toBeInTheDocument();
  });

  it('renders the topic title as the H1', () => {
    renderKo(egovframe);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(egovframe.ko.title);
  });

  it('renders the topic description', () => {
    renderKo(egovframe);
    expect(screen.getByText(egovframe.ko.description)).toBeInTheDocument();
  });

  it('renders all topic sections with links and descriptions', () => {
    renderKo(egovframe);
    // Every section heading is present.
    for (const section of egovframe.ko.sections) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
      // Every link label is present.
      for (const link of section.links) {
        expect(screen.getByText(link.label)).toBeInTheDocument();
      }
    }
  });

  it('renders a back-to-hub link', () => {
    renderKo(egovframe);
    const back = screen.getByTestId('bookmarks-spoke-back-to-hub');
    expect(back).toHaveAttribute('href', '/ko/tools/bookmarks');
  });

  it('renders English content for the en locale', () => {
    renderEn(egovframe);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(egovframe.en.title);
    expect(screen.getByText(egovframe.en.description)).toBeInTheDocument();
    expect(
      screen.getByTestId('bookmarks-spoke-back-to-hub')
    ).toHaveAttribute('href', '/en/tools/bookmarks');
  });
});
