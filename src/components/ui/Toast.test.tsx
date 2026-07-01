import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';
import { describe, it, expect, vi } from 'vitest';

describe('Toast Component', () => {
  it('does not render when open=false', () => {
    render(
      <Toast message="Hello" open={false} />
    );
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('renders message when open=true', () => {
    render(
      <Toast message="Hello" open={true} />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('has status role for accessibility', () => {
    render(
      <Toast message="Hello" open={true} />
    );
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('applies success type styling', () => {
    render(
      <Toast message="Success!" type="success" open={true} />
    );
    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('text-surface');
  });

  it('applies error type styling', () => {
    render(
      <Toast message="Error!" type="error" open={true} />
    );
    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('text-surface');
  });

  it('has transition classes', () => {
    render(
      <Toast message="Fade" open={true} />
    );
    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('transition-opacity');
  });
});
