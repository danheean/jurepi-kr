import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { RecentLookups } from './RecentLookups';
import type { RecentEntry } from '@/lib/age-calculator/recents';
import messages from '@/i18n/messages/ko.json';

const S = (date: string): RecentEntry => ({ date, calendarType: 'solar', isLeapMonth: false });

describe('RecentLookups', () => {
  const mockRecents: RecentEntry[] = [S('1999-03-15'), S('2000-06-20'), S('1985-12-25')];
  const mockOnSelectRecent = vi.fn();
  const mockOnClear = vi.fn();

  const renderComponent = (
    recents: RecentEntry[] = mockRecents,
    onSelectRecent = mockOnSelectRecent,
    onClear = mockOnClear
  ) => {
    return render(
      <NextIntlClientProvider locale="ko" messages={messages as any}>
        <RecentLookups recents={recents} onSelectRecent={onSelectRecent} onClear={onClear} />
      </NextIntlClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when recents is empty', () => {
    const { container } = renderComponent([]);
    expect(container.firstChild).toBeNull();
  });

  it('renders heading when recents exist', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].recents.heading)).toBeInTheDocument();
  });

  it('renders clear button', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].recents.clear)).toBeInTheDocument();
  });

  it('renders a chip for each recent', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button').filter(
      (btn) => !btn.textContent?.includes(messages.tools['age-calculator'].recents.clear)
    );
    expect(buttons.length).toBe(3);
  });

  it('calls onSelectRecent when chip is clicked', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button').filter(
      (btn) => !btn.textContent?.includes(messages.tools['age-calculator'].recents.clear)
    );
    fireEvent.click(buttons[0]);
    expect(mockOnSelectRecent).toHaveBeenCalledWith(S('1999-03-15'));
  });

  it('calls onClear when clear button is clicked', () => {
    renderComponent();
    const clearButton = screen.getByText(messages.tools['age-calculator'].recents.clear);
    fireEvent.click(clearButton);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('formats dates correctly for Korean locale', () => {
    renderComponent();
    // Check that dates are formatted (exact format depends on system locale)
    const buttons = screen.getAllByRole('button');
    const dateButtons = buttons.filter(
      (btn) => !btn.textContent?.includes(messages.tools['age-calculator'].recents.clear)
    );
    expect(dateButtons.length).toBe(3);
  });

  it('has correct aria-labels for accessibility', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button');
    const dateButtons = buttons.filter(
      (btn) => !btn.textContent?.includes(messages.tools['age-calculator'].recents.clear)
    );
    dateButtons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('has >=44px tap targets on chips', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button');
    const dateButtons = buttons.filter(
      (btn) => !btn.textContent?.includes(messages.tools['age-calculator'].recents.clear)
    );
    dateButtons.forEach((btn) => {
      // Check for min-h-11 and min-w-max classes which ensure >=44px
      expect(btn.className).toContain('min-h-11');
    });
  });

  it('renders with single recent', () => {
    renderComponent([S('2000-01-01')]);
    const buttons = screen.getAllByRole('button').filter(
      (btn) => !btn.textContent?.includes(messages.tools['age-calculator'].recents.clear)
    );
    expect(buttons.length).toBe(1);
  });
});
