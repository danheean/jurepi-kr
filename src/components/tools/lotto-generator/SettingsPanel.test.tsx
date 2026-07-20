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

  it('renders game count input', () => {
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

    const input = screen.getByDisplayValue('3');
    expect(input).toBeInTheDocument();
  });

  it('calls onGameCountChange when game count changes', () => {
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

    const input = screen.getByDisplayValue('3') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });

    expect(mockHandlers.onGameCountChange).toHaveBeenCalledWith(5);
  });

  it('renders fixed numbers chips', () => {
    renderWithIntl(
      <SettingsPanel
        gameCount={1}
        onGameCountChange={mockHandlers.onGameCountChange}
        fixedNumbers={[7, 13]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    expect(screen.getByText('7')).toBeInTheDocument();
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
        fixedNumbers={[7, 13]}
        onAddFixed={mockHandlers.onAddFixed}
        onRemoveFixed={mockHandlers.onRemoveFixed}
        excludedNumbers={[]}
        onAddExcluded={mockHandlers.onAddExcluded}
        onRemoveExcluded={mockHandlers.onRemoveExcluded}
      />
    );

    // Find the chip containing "7" and click its remove button
    const chipWithSeven = screen.getAllByText('7')[0].closest('div');
    const removeButton = chipWithSeven?.querySelector('button');

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
