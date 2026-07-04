import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error title', () => {
    render(<ErrorMessage line={1} column={5} token="}" context='{"a": ' />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('displays line and column numbers', () => {
    render(<ErrorMessage line={5} column={12} token="}" context="context snippet" />);

    expect(screen.getByText(/Line 5, column 12/)).toBeInTheDocument();
  });

  it('shows token that caused error', () => {
    render(<ErrorMessage line={1} column={1} token="}" context="" />);

    expect(screen.getByText(/Unexpected token '\}'/)).toBeInTheDocument();
  });

  it('displays context snippet', () => {
    render(<ErrorMessage line={1} column={1} token="}" context='{"a": 1, }' />);

    expect(screen.getByText('{"a": 1, }')).toBeInTheDocument();
  });

  it('has role alert for accessibility', () => {
    const { container } = render(
      <ErrorMessage line={1} column={1} token="}" context="" />
    );

    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });
});
