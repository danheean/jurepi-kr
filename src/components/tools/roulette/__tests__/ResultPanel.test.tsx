import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { ResultPanel } from '../ResultPanel';
import type { Option } from '@/lib/roulette/schema';

describe('ResultPanel', () => {
  const mockOptions: Option[] = [
    { label: 'Pizza', weight: 1 },
    { label: 'Pasta', weight: 1 },
    { label: 'Burger', weight: 1 },
  ];

  it('does not render when selectedIndex is null', () => {
    const { container } = render(
      <ResultPanel
        selectedIndex={null}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders winner name when selectedIndex is set', () => {
    render(
      <ResultPanel
        selectedIndex={1}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('displays congratulations eyebrow', () => {
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
  });

  it('has aria-live region for screen reader announcement', () => {
    const { container } = render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const ariaLiveRegion = container.querySelector('[aria-live="polite"]');
    expect(ariaLiveRegion).toBeInTheDocument();
    expect(ariaLiveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces result via screen reader hidden text', () => {
    const { container } = render(
      <ResultPanel
        selectedIndex={2}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    // Check for sr-only element with announcement
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).toBeInTheDocument();
    // Should contain the winner's result announcement
    expect(srOnly?.textContent).toContain("Burger is the winner");
  });

  it('renders Spin Again button and calls onSpin on click', async () => {
    const onSpin = vi.fn();
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={onSpin}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const spinAgainButton = screen.getByRole('button', { name: 'Spin Again' });
    expect(spinAgainButton).toBeInTheDocument();

    await userEvent.click(spinAgainButton);
    expect(onSpin).toHaveBeenCalledTimes(1);
  });

  it('disables Spin Again button when spinning is true', () => {
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={true}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const spinAgainButton = screen.getByRole('button', { name: 'Spin Again' });
    expect(spinAgainButton).toBeDisabled();
  });

  it('does not render Remove & Re-spin button when showRemoveOption is false', () => {
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const removeButton = screen.queryByRole('button', { name: 'Remove & Re-spin' });
    expect(removeButton).not.toBeInTheDocument();
  });

  it('renders Remove & Re-spin button when showRemoveOption is true', () => {
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={true}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove & Re-spin' });
    expect(removeButton).toBeInTheDocument();
  });

  it('calls onRemoveAndSpin when Remove & Re-spin button is clicked', async () => {
    const onRemoveAndSpin = vi.fn();
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={true}
        onSpin={vi.fn()}
        onRemoveAndSpin={onRemoveAndSpin}
        prefersReducedMotion={false}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove & Re-spin' });
    await userEvent.click(removeButton);

    expect(onRemoveAndSpin).toHaveBeenCalledTimes(1);
  });

  it('disables Remove & Re-spin button when spinning is true', () => {
    render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={true}
        showRemoveOption={true}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove & Re-spin' });
    expect(removeButton).toBeDisabled();
  });

  it('disables Remove & Re-spin button when only 1 option remains', () => {
    const singleOption: Option[] = [{ label: 'Pizza', weight: 1 }];
    render(
      <ResultPanel
        selectedIndex={0}
        options={singleOption}
        spinning={false}
        showRemoveOption={true}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove & Re-spin' });
    expect(removeButton).toBeDisabled();
  });

  it('enables Remove & Re-spin button when 2+ options remain', () => {
    const twoOptions: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
    ];
    render(
      <ResultPanel
        selectedIndex={0}
        options={twoOptions}
        spinning={false}
        showRemoveOption={true}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove & Re-spin' });
    expect(removeButton).not.toBeDisabled();
  });

  it('renders with correct role=status for result panel', () => {
    const { container } = render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    const statusRegion = container.querySelector('[role="status"]');
    expect(statusRegion).toBeInTheDocument();
  });

  it('displays all three options as potential winners', () => {
    const { rerender } = render(
      <ResultPanel
        selectedIndex={0}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    expect(screen.getByText('Pizza')).toBeInTheDocument();

    rerender(
      <ResultPanel
        selectedIndex={1}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    expect(screen.getByText('Pasta')).toBeInTheDocument();

    rerender(
      <ResultPanel
        selectedIndex={2}
        options={mockOptions}
        spinning={false}
        showRemoveOption={false}
        onSpin={vi.fn()}
        onRemoveAndSpin={vi.fn()}
        prefersReducedMotion={false}
      />
    );

    expect(screen.getByText('Burger')).toBeInTheDocument();
  });
});
