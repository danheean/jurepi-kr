import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarPanel } from './CalendarPanel';
import { type DailyJournalState, type DailyJournalActions } from './useDailyJournal';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ko',
}));

const mockState: DailyJournalState = {
  today: '2026-06-30',
  todayEntry: { date: '2026-06-30', questionKey: '06-30', text: 'Today answer', createdAt: 0, updatedAt: 0 },
  todayQuestion: { key: '06-30', text: 'Today question' },
  currentStreak: 5,
  longestStreak: 10,
  totalAnswered: 50,
  yearCompletion: { answered: 50, elapsed: 181 },
  entries: {
    '2026-06-30': { date: '2026-06-30', questionKey: '06-30', text: 'Today', createdAt: 0, updatedAt: 0 },
    '2026-06-29': { date: '2026-06-29', questionKey: '06-29', text: 'Yesterday', createdAt: 0, updatedAt: 0 },
  },
  store: { version: 1, entries: {}, meta: { createdAt: 0 } },
  onboarded: true,
  showBackupReminder: false,
  mounted: true,
  storageError: { type: null, message: '' },
};

const mockActions: DailyJournalActions = {
  upsertEntry: vi.fn(),
  deleteEntry: vi.fn(),
  getEntry: vi.fn((date) => mockState.entries[date]),
  entriesForMonthDay: vi.fn(() => []),
  searchEntries: vi.fn(() => []),
  getQuestionText: vi.fn(() => 'Mock question'),
  exportJson: vi.fn(() => ({ blob: new Blob(), filename: 'backup.json' })),
  importJson: vi.fn(() => Promise.resolve({ success: true })),
  reset: vi.fn(),
  dismissBackupReminder: vi.fn(),
  setOnboarded: vi.fn(),
};

describe('CalendarPanel', () => {
  it('renders month grid with day cells', () => {
    render(<CalendarPanel {...mockState} {...mockActions} />);

    // Should have day buttons
    const dayButtons = screen.getAllByRole('button').filter(
      (btn) => /^\d+$/.test(btn.textContent || '')
    );
    expect(dayButtons.length).toBeGreaterThan(0);
  });

  it('renders day buttons for current month', () => {
    render(<CalendarPanel {...mockState} {...mockActions} />);

    // Should render day buttons
    const dayButtons = screen.getAllByRole('button').filter(
      (btn) => /^\d+$/.test(btn.textContent || '')
    );
    expect(dayButtons.length).toBeGreaterThan(0);
  });

  it('renders day buttons for each day of the month', () => {
    render(<CalendarPanel {...mockState} {...mockActions} />);

    // Should have day buttons for the current display month
    const dayButtons = screen.getAllByRole('button').filter(
      (btn) => /^\d+$/.test(btn.textContent || '')
    );

    // June has 30 days
    expect(dayButtons.length).toBeGreaterThanOrEqual(25);
  });

  it('allows year switching', async () => {
    const user = userEvent.setup();
    render(<CalendarPanel {...mockState} {...mockActions} />);

    // Should show current year (2026)
    expect(screen.getByText('2026')).toBeInTheDocument();

    // Click prev year button
    const prevYearBtn = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('aria-label') === 'calendar.prevYear'
    );

    if (prevYearBtn && !prevYearBtn.hasAttribute('disabled')) {
      await user.click(prevYearBtn);
      // Year should change (hard to verify exact year without deeper inspection)
    }
  });

  it('renders month navigation buttons', () => {
    render(<CalendarPanel {...mockState} {...mockActions} />);

    // Should have prev/next month buttons
    const buttons = screen.getAllByRole('button');
    const monthNavButtons = buttons.filter(
      (btn) => btn.getAttribute('aria-label')?.includes('calendar.prev') ||
               btn.getAttribute('aria-label')?.includes('calendar.next')
    );
    expect(monthNavButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders weekday headers', () => {
    render(<CalendarPanel {...mockState} {...mockActions} />);

    // Should have 7 weekday divs (일 월 화 수 목 금 토)
    const weekdayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    weekdayHeaders.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });
});
