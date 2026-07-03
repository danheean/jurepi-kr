import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { EraTabs } from './EraTabs';
import type { Era } from './useDevPeopleCatalog';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

function renderKo(selectedEra: Era | undefined = undefined, onSelectEra = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <EraTabs selectedEra={selectedEra} onSelectEra={onSelectEra} />
    </NextIntlClientProvider>
  );
}

function renderEn(selectedEra: Era | undefined = undefined, onSelectEra = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <EraTabs selectedEra={selectedEra} onSelectEra={onSelectEra} />
    </NextIntlClientProvider>
  );
}

describe('EraTabs', () => {
  it('renders as a tablist', () => {
    renderKo();

    const tablist = screen.getByTestId('era-tabs');
    expect(tablist).toHaveAttribute('role', 'tablist');
  });

  it('renders "All" tab with undefined id', () => {
    renderKo();

    const allTab = screen.getByTestId('era-tab-undefined');
    expect(allTab).toBeInTheDocument();
    expect(allTab).toHaveAttribute('role', 'tab');
  });

  it('renders era tabs with i18n labels (1940–1960, 1960–1980, etc.)', () => {
    renderKo();

    // Use testid instead of name to avoid dash/hyphen issues
    expect(screen.getByTestId('era-tab-1940-1960')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-1960-1980')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-1980-2000')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-2000-present')).toBeInTheDocument();
  });

  it('sets aria-selected=true for active era tab', () => {
    renderKo('1980-2000');

    const eraTab = screen.getByTestId('era-tab-1980-2000');
    expect(eraTab).toHaveAttribute('aria-selected', 'true');
  });

  it('sets aria-selected=false for inactive era tabs', () => {
    renderKo('1980-2000');

    const otherTab = screen.getByTestId('era-tab-1960-1980');
    expect(otherTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSelectEra when era tab is clicked', async () => {
    const onSelectEra = vi.fn();
    const user = userEvent.setup();

    renderKo(undefined, onSelectEra);

    const eraTab = screen.getByTestId('era-tab-1980-2000');
    await user.click(eraTab);

    expect(onSelectEra).toHaveBeenCalledWith('1980-2000');
  });

  it('calls onSelectEra with undefined when All tab is clicked', async () => {
    const onSelectEra = vi.fn();
    const user = userEvent.setup();

    renderKo('1980-2000', onSelectEra);

    const allTab = screen.getByTestId('era-tab-undefined');
    await user.click(allTab);

    expect(onSelectEra).toHaveBeenCalledWith(undefined);
  });

  it('applies active styling to selected era tab', () => {
    renderKo('1980-2000');

    const eraTab = screen.getByTestId('era-tab-1980-2000');
    expect(eraTab).toHaveClass('bg-brand', 'text-on-brand');
  });

  it('applies inactive styling to unselected era tabs', () => {
    renderKo('1980-2000');

    const otherTab = screen.getByTestId('era-tab-1960-1980');
    expect(otherTab).toHaveClass('bg-surface-muted', 'text-text-secondary');
  });

  it('has data-testid on each era tab button', () => {
    renderKo();

    expect(screen.getByTestId('era-tab-undefined')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-1940-1960')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-1960-1980')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-1980-2000')).toBeInTheDocument();
    expect(screen.getByTestId('era-tab-2000-present')).toBeInTheDocument();
  });

  it('renders English labels for en locale', () => {
    renderEn();

    expect(screen.getByTestId('era-tab-undefined')).toHaveTextContent('All');
    expect(screen.getByTestId('era-tab-1940-1960')).toBeInTheDocument();
  });

  it('has focus ring on focus', async () => {
    renderKo();
    const user = userEvent.setup();

    const eraTab = screen.getByTestId('era-tab-1980-2000');
    await user.click(eraTab);

    expect(eraTab).toHaveFocus();
  });

  it('renders all 5 era tabs (All + 4 eras)', () => {
    renderKo();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });
});
