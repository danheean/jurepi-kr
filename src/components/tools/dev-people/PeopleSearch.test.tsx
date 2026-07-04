import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { PeopleSearch } from './PeopleSearch';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

function renderKo(query = '', setQuery = vi.fn(), resultCount = 0) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <PeopleSearch query={query} setQuery={setQuery} resultCount={resultCount} />
    </NextIntlClientProvider>
  );
}

function renderEn(query = '', setQuery = vi.fn(), resultCount = 0) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <PeopleSearch query={query} setQuery={setQuery} resultCount={resultCount} />
    </NextIntlClientProvider>
  );
}

describe('PeopleSearch', () => {
  it('renders search input with label', () => {
    renderKo();

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-label');
  });

  it('renders placeholder text from i18n', () => {
    renderKo();

    const input = screen.getByPlaceholderText(/이름·태그·기간으로|Search by name, tags, or era/i);
    expect(input).toBeInTheDocument();
  });

  it('calls setQuery on input change', async () => {
    const setQuery = vi.fn();
    const user = userEvent.setup();

    renderKo('', setQuery);

    const input = screen.getByRole('textbox');
    await user.type(input, 'hinton');

    expect(setQuery).toHaveBeenCalled();
  });

  it('displays search result count when query is present', () => {
    renderKo('hinton', vi.fn(), 1);

    expect(screen.getByTestId('people-search-result-count')).toBeInTheDocument();
  });

  it('hides result count when query is empty', () => {
    renderKo('', vi.fn(), 5);

    expect(screen.queryByTestId('people-search-result-count')).not.toBeInTheDocument();
  });

  it('shows clear button only when query is not empty', async () => {
    const setQuery = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
        <PeopleSearch query="" setQuery={setQuery} resultCount={0} />
      </NextIntlClientProvider>
    );

    expect(screen.queryByTestId('people-search-clear')).not.toBeInTheDocument();

    // Update with a query
    rerender(
      <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
        <PeopleSearch query="hinton" setQuery={setQuery} resultCount={1} />
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId('people-search-clear')).toBeInTheDocument();
  });

  it('calls setQuery with empty string on clear button click', async () => {
    const setQuery = vi.fn();
    const user = userEvent.setup();

    renderKo('hinton', setQuery, 1);

    const clearButton = screen.getByTestId('people-search-clear');
    await user.click(clearButton);

    expect(setQuery).toHaveBeenCalledWith('');
  });

  it('has aria-controls attribute pointing to people-list', () => {
    renderKo();

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-controls', 'people-list');
  });

  it('has aria-live attribute on result count', () => {
    renderKo('test', vi.fn(), 3);

    const resultCount = screen.getByTestId('people-search-result-count');
    expect(resultCount).toHaveAttribute('aria-live', 'polite');
    expect(resultCount).toHaveAttribute('aria-atomic', 'true');
  });

  it('has data-testid on input and clear button', () => {
    renderKo('query', vi.fn(), 1);

    expect(screen.getByTestId('people-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('people-search-clear')).toBeInTheDocument();
  });

  it('renders English content for en locale', () => {
    renderEn('hinton', vi.fn(), 1);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder');
    expect(screen.getByText(/1 people/)).toBeInTheDocument();
  });
});
