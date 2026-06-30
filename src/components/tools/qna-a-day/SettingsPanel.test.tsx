import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from './SettingsPanel';
import { type DailyJournalState, type DailyJournalActions } from './useDailyJournal';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
beforeEach(() => {
  // @ts-ignore
  global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  // @ts-ignore
  global.URL.revokeObjectURL = vi.fn();
});

const mockState: DailyJournalState = {
  today: '2026-06-30',
  todayEntry: undefined,
  todayQuestion: { key: '06-30', text: 'Today question' },
  currentStreak: 5,
  longestStreak: 10,
  totalAnswered: 10,
  yearCompletion: { answered: 10, elapsed: 181 },
  entries: {},
  store: { version: 1, entries: {}, meta: { createdAt: 0 } },
  onboarded: true,
  showBackupReminder: false,
  mounted: true,
  storageError: { type: null, message: '' },
};

const mockActions: DailyJournalActions = {
  upsertEntry: vi.fn(),
  deleteEntry: vi.fn(),
  getEntry: vi.fn(() => undefined),
  entriesForMonthDay: vi.fn(() => []),
  searchEntries: vi.fn(() => []),
  getQuestionText: vi.fn(() => 'Mock question'),
  exportJson: vi.fn(() => ({
    blob: new Blob(['{"version":1,"entries":{},"meta":{}}'], {
      type: 'application/json',
    }),
    filename: 'jurepi-qna-a-day-backup-2026-06-30.json',
  })),
  importJson: vi.fn(() => Promise.resolve({ success: true })),
  reset: vi.fn(),
  dismissBackupReminder: vi.fn(),
  setOnboarded: vi.fn(),
};

describe('SettingsPanel', () => {
  it('renders export button', () => {
    render(<SettingsPanel {...mockState} {...mockActions} />);

    expect(screen.getByText('settings.exportButton')).toBeInTheDocument();
  });

  it('exports JSON file when export button is clicked', async () => {
    const user = userEvent.setup();

    render(<SettingsPanel {...mockState} {...mockActions} />);

    const exportBtn = screen.getByText('settings.exportButton');
    await user.click(exportBtn);

    // Verify export action was triggered
    expect(mockActions.exportJson).toHaveBeenCalled();
  });

  it('renders import button', () => {
    render(<SettingsPanel {...mockState} {...mockActions} />);

    expect(screen.getByText('settings.importButton')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(<SettingsPanel {...mockState} {...mockActions} />);

    expect(screen.getByText('settings.resetButton')).toBeInTheDocument();
  });

  it('shows reset confirmation when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel {...mockState} {...mockActions} />);

    const resetBtn = screen.getByText('settings.resetButton');
    await user.click(resetBtn);

    // Should show confirmation modal with text input
    const confirmInput = screen.getByPlaceholderText("'모두 삭제'를 입력하세요");
    expect(confirmInput).toBeInTheDocument();
  });

  it('enables delete button only when confirmation text matches', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel {...mockState} {...mockActions} />);

    const resetBtn = screen.getByText('settings.resetButton');
    await user.click(resetBtn);

    const confirmInput = screen.getByPlaceholderText("'모두 삭제'를 입력하세요");
    const deleteBtn = screen.getByText('삭제');

    // Initially disabled
    expect(deleteBtn).toHaveAttribute('disabled');

    // Type correct confirmation
    await user.type(confirmInput, '모두 삭제');

    // Should be enabled
    expect(deleteBtn).not.toHaveAttribute('disabled');
  });

  it('renders privacy section', () => {
    render(<SettingsPanel {...mockState} {...mockActions} />);

    expect(screen.getByText('settings.privacyTitle')).toBeInTheDocument();
    expect(screen.getByText('settings.privacyBody')).toBeInTheDocument();
  });

  it('shows storage error warning when storageError is set', () => {
    const stateWithError = {
      ...mockState,
      storageError: { type: 'UNAVAILABLE' as const, message: 'Storage unavailable' },
    };

    render(<SettingsPanel {...stateWithError} {...mockActions} />);

    expect(screen.getByText('settings.storageUnavailable')).toBeInTheDocument();
  });

  it('disables export button when no entries', () => {
    const emptyState = { ...mockState, totalAnswered: 0 };

    render(<SettingsPanel {...emptyState} {...mockActions} />);

    const exportBtn = screen.getByText('settings.exportButton');
    expect(exportBtn).toHaveAttribute('disabled');
  });
});
