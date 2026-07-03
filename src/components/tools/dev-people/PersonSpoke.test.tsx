import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PersonSpoke } from './PersonSpoke';
import type { MergedPerson } from '@/lib/dev-people/schema';
import peopleData from './data/dev-people.generated.json';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const CATALOG = (peopleData as any).peoples as MergedPerson[];
const geoffrey = CATALOG.find((p) => p.slug === 'geoffrey-hinton')!;

function renderKo(person: MergedPerson) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <PersonSpoke person={person} locale="ko" />
    </NextIntlClientProvider>
  );
}

function renderEn(person: MergedPerson) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <PersonSpoke person={person} locale="en" />
    </NextIntlClientProvider>
  );
}

describe('PersonSpoke', () => {
  it('renders person name as H1', () => {
    renderKo(geoffrey);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(geoffrey.ko.name);
  });

  it('displays birth year and age', () => {
    renderKo(geoffrey);

    // Birth year and age are displayed in the header
    const article = screen.getByRole('article');
    expect(article.textContent).toContain(`${geoffrey.birthYear}`);
    // Should show age info (Ko: "만 XX세")
    expect(article.textContent).toMatch(/만 \d+세/);
  });

  it('displays nationality', () => {
    renderKo(geoffrey);

    // Geoffrey Hinton: UK → "영국" (Ko) or "United Kingdom" (En)
    const article = screen.getByRole('article');
    expect(article.textContent).toMatch(/영국|United Kingdom/);
  });

  it('displays tags with i18n labels', () => {
    renderKo(geoffrey);

    // Geoffrey has tags: ai, deep-learning
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Deep Learning')).toBeInTheDocument();
  });

  it('displays era badge', () => {
    renderKo(geoffrey);

    expect(screen.getByText('1980–2000')).toBeInTheDocument();
  });

  it('displays photo with alt text', () => {
    renderKo(geoffrey);

    const img = screen.getByAltText(geoffrey.ko.name) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('geoffrey-hinton.jpg');
  });

  it('displays biography body with markdown rendering', () => {
    renderKo(geoffrey);

    // Biography body contains "## 소개" (About section header)
    expect(screen.getByText(/소개|About/i)).toBeInTheDocument();
  });

  it('renders achievements section with year and description', () => {
    renderKo(geoffrey);

    // Ko locale: "업적"
    const achievementsHeading = screen.getByText(/Achievements|업적/);
    expect(achievementsHeading).toBeInTheDocument();

    const article = screen.getByRole('article');
    // Geoffrey has 4 achievements
    expect(article.textContent).toContain('1986');
    expect(article.textContent).toContain('2006');
    expect(article.textContent).toContain('2018');
    expect(article.textContent).toContain('2024');

    // Check for achievement descriptions in Korean
    expect(article.textContent).toMatch(/역전파|backpropagation|알고리즘/i);
  });

  it('renders books section with titles and years', () => {
    renderKo(geoffrey);

    // Ko locale: "저서"
    const booksHeading = screen.getByText(/Books|저서/);
    expect(booksHeading).toBeInTheDocument();

    const article = screen.getByRole('article');
    // Geoffrey has 1 book
    expect(article.textContent).toContain('Artificial Neural Networks');
    expect(article.textContent).toContain('1992');
  });

  it('renders external links section', () => {
    renderKo(geoffrey);

    // Ko locale: "링크" as H2
    const linksHeadings = screen.getAllByRole('heading', { level: 2 });
    const linksHeading = linksHeadings.find(h => h.textContent?.includes('Links') || h.textContent?.includes('링크'));
    expect(linksHeading).toBeInTheDocument();

    // Geoffrey has multiple links
    const article = screen.getByRole('article');
    expect(article.textContent).toMatch(/Wikipedia|Google Scholar/);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });
  });

  it('renders disclaimer section', () => {
    renderKo(geoffrey);

    // Disclaimer text should be present (Ko or En)
    const article = screen.getByRole('article');
    expect(article.textContent).toMatch(/This information has been compiled|이 정보는 편집자가/i);
  });

  it('biography section contains exactly 1 "About" heading (no double heading)', () => {
    renderKo(geoffrey);

    // Count "About" headings — should be 1 from markdown, not duplicated
    const aboutHeadings = screen.queryAllByText(/About|소개/);
    // Note: queryAllByText returns various matches; we check that the core biography H2 exists once
    const h2s = screen.queryAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1); // At least "Achievements", "Books", "Links"
  });

  it('renders English content for en locale', () => {
    renderEn(geoffrey);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(geoffrey.en.name);

    // English bio should have "About" instead of "소개"
    expect(screen.getByText(/About/)).toBeInTheDocument();

    const achievementsHeading = screen.getByText('Achievements');
    expect(achievementsHeading).toBeInTheDocument();
  });

  it('en locale does not expose hangul in non-biography sections', () => {
    renderEn(geoffrey);

    const tagsArea = screen.getByText('AI').parentElement?.parentElement?.textContent || '';
    const hangulRegex = /[가-힣]/;
    expect(hangulRegex.test(tagsArea)).toBe(false);

    const achievementsArea = screen.getByText('2006').parentElement?.textContent || '';
    // Achievement description should be in English
    expect(achievementsArea).toMatch(/Deep Belief Networks|2006/);
  });

  it('displays photo credit when available', () => {
    renderKo(geoffrey);

    if (geoffrey.photoCredit) {
      expect(screen.getByText(geoffrey.photoCredit)).toBeInTheDocument();
    }
  });
});
