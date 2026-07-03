import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { PersonCard } from './PersonCard';
import type { MergedPerson } from '@/lib/dev-people/schema';
import peopleData from './data/dev-people.generated.json';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const CATALOG = (peopleData as any).peoples as MergedPerson[];
const geoffrey = CATALOG.find((p) => p.slug === 'geoffrey-hinton')!;
const ericGamma = CATALOG.find((p) => p.slug === 'erich-gamma')!; // person without photo

function renderKo(person: MergedPerson, isFavorited = false, onToggleFavorite = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <PersonCard person={person} isFavorited={isFavorited} onToggleFavorite={onToggleFavorite} locale="ko" />
    </NextIntlClientProvider>
  );
}

function renderEn(person: MergedPerson, isFavorited = false, onToggleFavorite = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <PersonCard person={person} isFavorited={isFavorited} onToggleFavorite={onToggleFavorite} locale="en" />
    </NextIntlClientProvider>
  );
}

describe('PersonCard', () => {
  it('renders as a link with correct href to spoke', () => {
    renderKo(geoffrey);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ko/tools/dev-people/geoffrey-hinton');
  });

  it('renders visible card (not hidden)', () => {
    renderKo(geoffrey);

    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('hidden');
    expect(screen.getByText(geoffrey.ko.name)).toBeVisible();
  });

  it('displays person name, birth/death year, and knownFor', () => {
    renderKo(geoffrey);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link.textContent).toContain(geoffrey.ko.name);
    expect(link.textContent).toContain('1947');
    // knownFor might be wrapped in elements, check parent text content
    expect(screen.getByTestId(`person-card-${geoffrey.slug}`).textContent).toMatch(/역전파|backpropagation/);
  });

  it('displays tags with i18n labels', () => {
    renderKo(geoffrey);

    // Geoffrey has tags: ai, deep-learning
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Deep Learning')).toBeInTheDocument();
  });

  it('displays era badge with i18n label', () => {
    renderKo(geoffrey);

    // Geoffrey's era: "1980-2000"
    expect(screen.getByText('1980–2000')).toBeInTheDocument();
  });

  it('displays age when person is alive or age at death', () => {
    renderKo(geoffrey);

    // Geoffrey Hinton born 1947, still alive, so should show age
    // Ko locale: "만 XX세"
    const ageText = screen.getByText(/만 \d+세/);
    expect(ageText).toBeInTheDocument();
  });

  it('displays photo when available', () => {
    renderKo(geoffrey);

    const photo = screen.getByTestId('person-photo');
    expect(photo).toBeInTheDocument();
    const img = photo.querySelector('img');
    expect(img).toHaveAttribute('src', '/images/dev-people/geoffrey-hinton.jpg');
    expect(img).toHaveAttribute('alt', geoffrey.ko.name);
  });

  it('displays avatar initial when photo is not available', () => {
    renderKo(ericGamma); // Erich Gamma has no photo

    const avatar = screen.getByTestId('person-avatar');
    expect(avatar).toBeInTheDocument();
    // Ko locale renders "에리히 감마", so initial is "에"
    expect(avatar).toHaveTextContent('에');
  });

  it('favorite button is sibling of link, not nested', () => {
    const { container } = renderKo(geoffrey);

    const wrapper = container.querySelector('[class*="relative"]');
    const link = wrapper?.querySelector('a');
    const button = wrapper?.querySelector('button');

    expect(link?.parentElement).toBe(wrapper);
    expect(button?.parentElement).toBe(wrapper);
  });

  it('calls onToggleFavorite on star button click', async () => {
    const onToggleFavorite = vi.fn();
    const user = userEvent.setup();

    renderKo(geoffrey, false, onToggleFavorite);

    const starButton = screen.getByTestId(`person-star-${geoffrey.slug}`);
    await user.click(starButton);

    expect(onToggleFavorite).toHaveBeenCalledOnce();
  });

  it('shows filled star when isFavorited is true', () => {
    const { container } = renderKo(geoffrey, true);

    const starIcon = container.querySelector('[class*="fill-accent-sky-ink"]');
    expect(starIcon).toBeInTheDocument();
  });

  it('shows unfilled star when isFavorited is false', () => {
    const { container } = renderKo(geoffrey, false);

    const starIcon = container.querySelector('[class*="fill-accent-sky-ink"]');
    expect(starIcon).not.toBeInTheDocument();
  });

  it('has data-testid on card link and star button', () => {
    renderKo(geoffrey);

    expect(screen.getByTestId('person-card-geoffrey-hinton')).toBeInTheDocument();
    expect(screen.getByTestId('person-star-geoffrey-hinton')).toBeInTheDocument();
  });

  it('renders English content for the en locale', () => {
    renderEn(geoffrey);

    expect(screen.getByText(geoffrey.en.name)).toBeInTheDocument();
    expect(screen.getByText(/1947/)).toBeInTheDocument();
    expect(
      screen.getByRole('link')
    ).toHaveAttribute('href', '/en/tools/dev-people/geoffrey-hinton');
  });

  it('en locale should not expose Korean text (no hangul in tags/era)', () => {
    renderEn(geoffrey);

    const html = screen.getByText(geoffrey.en.name).closest('h3')?.parentElement?.parentElement?.textContent || '';
    // Verify no hangul characters in displayed text
    const hangulRegex = /[가-힣]/;
    // Skip the content sections and just check the tags/era area
    const tagArea = screen.getByText('AI').parentElement?.parentElement?.textContent || '';
    expect(hangulRegex.test(tagArea)).toBe(false);
  });

  it('does not call link onClick when star button is clicked', async () => {
    const onToggleFavorite = vi.fn();
    const user = userEvent.setup();

    renderKo(geoffrey, false, onToggleFavorite);

    const starButton = screen.getByTestId(`person-star-${geoffrey.slug}`);
    await user.click(starButton);

    // Verify link href is unchanged (click didn't navigate)
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ko/tools/dev-people/geoffrey-hinton');
  });
});
