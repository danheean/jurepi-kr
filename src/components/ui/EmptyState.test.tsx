import { render, screen, userEvent } from '@/__test__/test-utils';
import { EmptyState } from './EmptyState';
import { describe, it, expect, vi } from 'vitest';

describe('EmptyState', () => {
  it('renders heading, body, and button', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        heading="No results"
        body="Try again"
        actionLabel="Reset"
        onAction={onAction}
        showMascot={false}
      />
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        heading="No results"
        body="Try again"
        actionLabel="Reset"
        onAction={onAction}
        showMascot={false}
      />
    );

    const button = screen.getByRole('button', { name: 'Reset' });
    await user.click(button);
    expect(onAction).toHaveBeenCalled();
  });

  it('shows mascot by default', () => {
    render(
      <EmptyState
        heading="No results"
        body="Try again"
        actionLabel="Reset"
        onAction={() => {}}
      />
    );

    const mascot = screen.getByAltText('Jurepi 마스코트');
    expect(mascot).toBeInTheDocument();
  });

  it('hides mascot when showMascot is false', () => {
    render(
      <EmptyState
        heading="No results"
        body="Try again"
        actionLabel="Reset"
        onAction={() => {}}
        showMascot={false}
      />
    );

    const mascot = screen.queryByAltText('Jurepi 마스코트');
    expect(mascot).not.toBeInTheDocument();
  });

  it('applies correct heading class', () => {
    render(
      <EmptyState
        heading="No results"
        body="Try again"
        actionLabel="Reset"
        onAction={() => {}}
        showMascot={false}
      />
    );

    const heading = screen.getByText('No results');
    expect(heading).toHaveClass('font-display');
    expect(heading).toHaveClass('text-2xl');
  });

  it('uses testId for button when provided', () => {
    render(
      <EmptyState
        heading="No results"
        body="Try again"
        actionLabel="Reset"
        onAction={() => {}}
        showMascot={false}
        testId="empty"
      />
    );

    const button = screen.getByTestId('empty-action');
    expect(button).toBeInTheDocument();
  });
});
