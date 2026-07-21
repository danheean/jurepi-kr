import { render, screen, fireEvent } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { SettingsPanel } from './SettingsPanel';

function renderWithIntl(component: React.ReactElement) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
  });
}

describe('SettingsPanel', () => {
  const mockHandlers = {
    onGameCountChange: vi.fn(),
    onAddFixed: vi.fn(),
    onRemoveFixed: vi.fn(),
    onAddExcluded: vi.fn(),
    onRemoveExcluded: vi.fn(),
    onGenerateDisabledChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 1–10 game count chips with the current one pressed', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={3}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    // Boundary chips exist (1 and 10) — full 1..10 range rendered.
    expect(screen.getByRole('button', { name: '1 games' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10 games' })).toBeInTheDocument();

    // The current selection (3) is pressed; a non-selected chip is not.
    expect(screen.getByRole('button', { name: '3 games' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '5 games' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onGameCountChange with the tapped chip value (2–9 reachable in one tap)', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    // The original bug: could only land on 1 or 10. Now any value is one tap.
    fireEvent.click(screen.getByRole('button', { name: '5 games' }));
    expect(mockHandlers.onGameCountChange).toHaveBeenCalledWith(5);

    fireEvent.click(screen.getByRole('button', { name: '2 games' }));
    expect(mockHandlers.onGameCountChange).toHaveBeenCalledWith(2);
  });

  it('renders fixed numbers chips', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[17, 13]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    // Use values > 10 so they don't collide with the 1–10 game-count chips.
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('adds fixed number when button clicked', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    const inputs = screen.getAllByPlaceholderText('1–45');
    const fixedInput = inputs[0];
    fireEvent.change(fixedInput, { target: { value: '7' } });

    const addButtons = screen.getAllByRole('button', { name: /Add Number/i });
    fireEvent.click(addButtons[0]);

    expect(mockHandlers.onAddFixed).toHaveBeenCalledWith(7);
  });

  it('removes fixed number when X clicked', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[17, 13]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    // Find the chip containing "17" (>10, no collision with game-count chips) and click its remove button
    const chipWithSeventeen = screen.getByText('17').closest('div');
    const removeButton = chipWithSeventeen?.querySelector('button');

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    expect(mockHandlers.onRemoveFixed).toHaveBeenCalled();
  });

  it('shows infeasibility error when constraints invalid', () => {
    // Infeasible: (45 - excluded) < (6 - fixed). With 40 excluded and 0 fixed,
    // valid pool = 5 < 6 needed → the feasibility error must render.
    const excluded40 = Array.from({ length: 40 }, (_, i) => i + 1);
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={excluded40}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    expect(screen.getByText(/Not enough/i)).toBeInTheDocument();
  });

  it('disables add buttons when max reached', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[1, 2, 3, 4, 5]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /Add Number/i });
    expect(addButtons[0]).toBeDisabled();
  });
});
