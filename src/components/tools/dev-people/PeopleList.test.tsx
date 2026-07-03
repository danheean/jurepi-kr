import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { PeopleList } from './PeopleList';
import type { MergedPerson } from '@/lib/dev-people/schema';
import peopleData from './data/dev-people.generated.json';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const CATALOG = (peopleData as any).peoples as MergedPerson[];
const first3People = CATALOG.slice(0, 3);

function renderKo(
  people: MergedPerson[] = first3People,
  favorites: string[] = [],
  query = '',
  onToggleFavorite = vi.fn(),
  onClearQuery = vi.fn()
) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <PeopleList
        people={people}
        favorites={favorites}
        query={query}
        onToggleFavorite={onToggleFavorite}
        onClearQuery={onClearQuery}
        locale="ko"
      />
    </NextIntlClientProvider>
  );
}

function renderEn(
  people: MergedPerson[] = first3People,
  favorites: string[] = [],
  query = '',
  onToggleFavorite = vi.fn(),
  onClearQuery = vi.fn()
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <PeopleList
        people={people}
        favorites={favorites}
        query={query}
        onToggleFavorite={onToggleFavorite}
        onClearQuery={onClearQuery}
        locale="en"
      />
    </NextIntlClientProvider>
  );
}

describe('PeopleList', () => {
  it('renders person cards for each person in the list', () => {
    renderKo(first3People);

    first3People.forEach((person) => {
      expect(screen.getByText(person.ko.name)).toBeInTheDocument();
    });
  });

  it('renders cards with correct grid layout', () => {
    renderKo(first3People);

    const list = screen.getByTestId('people-list');
    expect(list).toHaveClass('grid', 'gap-4');
  });

  it('marks person as favorited when slug is in favorites', () => {
    const first = first3People[0];
    renderKo(first3People, [first.slug]);

    const starButton = screen.getByTestId(`person-star-${first.slug}`);
    expect(starButton.querySelector('svg')).toHaveClass('fill-accent-sky-ink');
  });

  it('calls onToggleFavorite with correct slug', async () => {
    const onToggleFavorite = vi.fn();
    const user = userEvent.setup();
    const first = first3People[0];

    renderKo(first3People, [], '', onToggleFavorite);

    const starButton = screen.getByTestId(`person-star-${first.slug}`);
    await user.click(starButton);

    expect(onToggleFavorite).toHaveBeenCalledWith(first.slug);
  });

  it('renders EmptyState when people list is empty', () => {
    renderKo([], [], 'no-results');

    // EmptyState shows when query is not empty
    expect(
      screen.getByTestId('empty-state-no-results')
    ).toBeInTheDocument();
  });

  it('displays id="people-list" for aria-controls binding', () => {
    renderKo(first3People);

    const list = screen.getByTestId('people-list');
    expect(list).toHaveAttribute('id', 'people-list');
  });

  it('renders English content for en locale', () => {
    renderEn(first3People);

    first3People.forEach((person) => {
      expect(screen.getByText(person.en.name)).toBeInTheDocument();
    });
  });

  it('passes correct locale to PersonCard', () => {
    renderKo(first3People);

    // PersonCard uses locale to pick ko/en data
    // Verify Korean names are displayed
    first3People.forEach((person) => {
      expect(screen.getByText(person.ko.name)).toBeInTheDocument();
    });
  });

  it('passes onClearQuery to EmptyState', async () => {
    const onClearQuery = vi.fn();
    const user = userEvent.setup();

    renderKo([], [], 'test-query', vi.fn(), onClearQuery);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClearQuery).toHaveBeenCalled();
  });
});
