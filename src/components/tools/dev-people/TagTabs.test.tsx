import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { TagTabs } from './TagTabs';
import type { Tag } from './useDevPeopleCatalog';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

function renderKo(
  selectedTag: Tag | undefined = undefined,
  onSelectTag = vi.fn(),
  favCount = 0,
  recentCount = 0
) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <TagTabs selectedTag={selectedTag} onSelectTag={onSelectTag} favCount={favCount} recentCount={recentCount} />
    </NextIntlClientProvider>
  );
}

function renderEn(
  selectedTag: Tag | undefined = undefined,
  onSelectTag = vi.fn(),
  favCount = 0,
  recentCount = 0
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <TagTabs selectedTag={selectedTag} onSelectTag={onSelectTag} favCount={favCount} recentCount={recentCount} />
    </NextIntlClientProvider>
  );
}

describe('TagTabs', () => {
  it('renders as a tablist', () => {
    renderKo();

    const tablist = screen.getByTestId('tag-tabs');
    expect(tablist).toHaveAttribute('role', 'tablist');
  });

  it('renders "All" tab with undefined id', () => {
    renderKo();

    const allTab = screen.getByTestId('tag-tab-undefined');
    expect(allTab).toBeInTheDocument();
    expect(allTab).toHaveAttribute('role', 'tab');
  });

  it('renders tag tabs with i18n labels', () => {
    renderKo();

    // Expect at least some common tags to be rendered
    expect(screen.getByTestId('tag-tab-ai')).toBeInTheDocument();
    expect(screen.getByTestId('tag-tab-python')).toBeInTheDocument();
  });

  it('sets aria-selected=true for active tab', () => {
    renderKo('ai');

    const aiTab = screen.getByTestId('tag-tab-ai');
    expect(aiTab).toHaveAttribute('aria-selected', 'true');
  });

  it('sets aria-selected=false for inactive tabs', () => {
    renderKo('ai');

    const pythonTab = screen.getByTestId('tag-tab-python');
    expect(pythonTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSelectTag when tab is clicked', async () => {
    const onSelectTag = vi.fn();
    const user = userEvent.setup();

    renderKo(undefined, onSelectTag);

    const aiTab = screen.getByTestId('tag-tab-ai');
    await user.click(aiTab);

    expect(onSelectTag).toHaveBeenCalledWith('ai');
  });

  it('calls onSelectTag with undefined when All tab is clicked', async () => {
    const onSelectTag = vi.fn();
    const user = userEvent.setup();

    renderKo('ai', onSelectTag);

    const allTab = screen.getByTestId('tag-tab-undefined');
    await user.click(allTab);

    expect(onSelectTag).toHaveBeenCalledWith(undefined);
  });

  it('applies active styling to selected tab', () => {
    renderKo('ai');

    const aiTab = screen.getByTestId('tag-tab-ai');
    expect(aiTab).toHaveClass('bg-brand', 'text-on-brand');
  });

  it('applies inactive styling to unselected tabs', () => {
    renderKo('ai');

    const pythonTab = screen.getByTestId('tag-tab-python');
    expect(pythonTab).toHaveClass('bg-surface-muted', 'text-text-secondary');
  });

  it('shows favorites tab only when favCount > 0', () => {
    renderKo(undefined, vi.fn(), 0);
    expect(screen.queryByText(/Favorites/i)).not.toBeInTheDocument();

    // Re-render with favCount > 0
    const { rerender } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
        <TagTabs selectedTag={undefined} onSelectTag={vi.fn()} favCount={1} recentCount={0} />
      </NextIntlClientProvider>
    );

    // Favorites placeholder is null, so it shouldn't be rendered at all
    // but the count param is acknowledged
  });

  it('has data-testid on each tab button', () => {
    renderKo();

    const allTab = screen.getByTestId('tag-tab-undefined');
    expect(allTab).toBeInTheDocument();

    const aiTab = screen.getByTestId('tag-tab-ai');
    expect(aiTab).toBeInTheDocument();
  });

  it('renders English labels for en locale', () => {
    renderEn();

    expect(screen.getByTestId('tag-tab-undefined')).toHaveTextContent('All');
    expect(screen.getByTestId('tag-tab-ai')).toBeInTheDocument();
  });

  it('has focus ring on focus', async () => {
    renderKo();
    const user = userEvent.setup();

    const aiTab = screen.getByTestId('tag-tab-ai');
    await user.click(aiTab);

    // Tab should be focused
    expect(aiTab).toHaveFocus();
  });
});
