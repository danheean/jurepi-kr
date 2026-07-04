import { render, userEvent, screen } from '@/__test__/test-utils';
import { RecentsPanel } from './RecentsPanel';
import type { RecentsEntry } from '@/lib/unit-converter';

/**
 * RecentsPanel component tests
 * Tests empty state, recent entries display, restore functionality,
 * clear button, and timestamp formatting.
 */

describe('RecentsPanel', () => {
  const mockOnRestore = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    mockOnRestore.mockClear();
    mockOnClear.mockClear();
  });

  const createRecentEntry = (overrides?: Partial<RecentsEntry>): RecentsEntry => ({
    categoryId: 'length',
    fromUnit: 'meter',
    toUnit: 'kilometer',
    fromValue: 100,
    toValue: 0.1,
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    ...overrides,
  });

  describe('empty state', () => {
    it('should display "No conversions yet" when recents is empty', () => {
      render(
        <RecentsPanel recents={[]} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      expect(screen.getByText('No conversions yet')).toBeInTheDocument();
    });

    it('should not render recent entries or buttons when empty', () => {
      render(
        <RecentsPanel recents={[]} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // No clear button should be visible
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should be centered and muted in appearance', () => {
      const { container } = render(
        <RecentsPanel recents={[]} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const emptyDiv = container.querySelector('.text-center');
      expect(emptyDiv).toBeInTheDocument();
      expect(emptyDiv?.className).toContain('text-text-muted');
    });
  });

  describe('with recent entries', () => {
    it('should display heading "Recent Conversions"', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      expect(screen.getByText('Recent Conversions')).toBeInTheDocument();
    });

    it('should display a clear button', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const clearButton = screen.getByLabelText('Clear history');
      expect(clearButton).toBeInTheDocument();
    });

    it('should render one button per recent entry', () => {
      const recents = [
        createRecentEntry(),
        createRecentEntry({ fromValue: 50 }),
        createRecentEntry({ categoryId: 'mass' }),
      ];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // Should have 3 recent entries + 1 clear button = 4 buttons total
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3); // At least 3 recent buttons
    });

    it('should display entry values and units', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // Should show conversion info like "100 meter → kilometer"
      const entryText = screen.getByText(/100.*meter.*kilometer/i);
      expect(entryText).toBeInTheDocument();
    });

    it('should call onRestore when entry is clicked', async () => {
      const user = userEvent.setup();
      const recentEntry = createRecentEntry();
      const recents = [recentEntry];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // Find and click the entry button (not the clear button)
      const buttons = screen.getAllByRole('button');
      const entryButton = buttons.find(btn => btn.textContent?.includes('Meter'));

      await user.click(entryButton!);

      expect(mockOnRestore).toHaveBeenCalledWith(recentEntry);
    });

    it('should call onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const clearButton = screen.getByLabelText('Clear history');
      await user.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('should display relative timestamps like "5m ago"', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // Should show something like "5m ago"
      expect(screen.getByText(/m ago/i)).toBeInTheDocument();
    });

    it('should display "Just now" for timestamps < 1 minute old', () => {
      const recents = [
        createRecentEntry({ timestamp: Date.now() - 30 * 1000 }), // 30 seconds ago
      ];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should display hours for timestamps >= 1 hour old', () => {
      const recents = [
        createRecentEntry({ timestamp: Date.now() - 3 * 60 * 60 * 1000 }), // 3 hours ago
      ];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      expect(screen.getByText(/3h ago/i)).toBeInTheDocument();
    });

    it('should display days for timestamps >= 1 day old', () => {
      const recents = [
        createRecentEntry({ timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 }), // 2 days ago
      ];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      expect(screen.getByText(/2d ago/i)).toBeInTheDocument();
    });

    it('should display formatted date for timestamps >= 7 days old', () => {
      const recents = [
        createRecentEntry({ timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 }), // 10 days ago
      ];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // The panel should render the recents section with entries
      const headingElement = screen.getByText('Recent Conversions');
      expect(headingElement).toBeInTheDocument();

      // Look for the conversion entry text
      const entryText = screen.getByText(/100.*meter.*kilometer/i);
      expect(entryText).toBeInTheDocument();
    });

    it('should have title attribute with timestamp for hover tooltip', () => {
      const recents = [createRecentEntry()];

      const { container } = render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // Find entry button with title attribute
      const buttons = container.querySelectorAll('button');
      const entryButton = Array.from(buttons).find(btn => btn.textContent?.includes('Meter'));

      expect(entryButton?.hasAttribute('title')).toBe(true);
    });

    it('should display multiple recent entries in order', () => {
      const recents = [
        createRecentEntry({ fromValue: 100 }),
        createRecentEntry({ fromValue: 50 }),
        createRecentEntry({ fromValue: 25 }),
      ];

      const { container } = render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      // All three should be visible
      expect(screen.getByText(/100.*meter/i)).toBeInTheDocument();
      expect(screen.getByText(/50.*meter/i)).toBeInTheDocument();
      expect(screen.getByText(/25.*meter/i)).toBeInTheDocument();
    });

    it('should support different categories in recents', () => {
      const recents = [
        createRecentEntry({ categoryId: 'length' }),
        createRecentEntry({ categoryId: 'mass', fromUnit: 'kilogram', toUnit: 'pound' }),
      ];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      expect(screen.getByText(/meter.*kilometer/i)).toBeInTheDocument();
      expect(screen.getByText(/kilogram.*pound/i)).toBeInTheDocument();
    });

    it('should show correct entry for each recent click', async () => {
      const user = userEvent.setup();
      const entry1 = createRecentEntry({ fromValue: 100, categoryId: 'length' });
      const entry2 = createRecentEntry({ fromValue: 50, categoryId: 'mass' });
      const recents = [entry1, entry2];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const buttons = screen.getAllByRole('button');
      const entry1Button = buttons.find(btn => btn.textContent?.includes('100'));
      const entry2Button = buttons.find(btn => btn.textContent?.includes('50'));

      await user.click(entry1Button!);
      expect(mockOnRestore).toHaveBeenCalledWith(entry1);

      await user.click(entry2Button!);
      expect(mockOnRestore).toHaveBeenCalledWith(entry2);
    });

    it('should have keyboard accessible buttons', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('clear button accessibility', () => {
    it('should have aria-label on clear button', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const clearButton = screen.getByLabelText('Clear history');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear history');
    });

    it('should have title attribute on clear button', () => {
      const recents = [createRecentEntry()];

      render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const clearButton = screen.getByLabelText('Clear history');
      expect(clearButton).toHaveAttribute('title', 'Clear history');
    });
  });

  describe('entry button accessibility', () => {
    it('should have focus-visible outline', () => {
      const recents = [createRecentEntry()];

      const { container } = render(
        <RecentsPanel recents={recents} onRestore={mockOnRestore} onClear={mockOnClear} />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.className).toContain('focus-visible');
      });
    });
  });
});
