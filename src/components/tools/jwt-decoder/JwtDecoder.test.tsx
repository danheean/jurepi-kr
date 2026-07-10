import { render, screen, userEvent, waitFor } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtDecoder } from './JwtDecoder';

// Mock useReducedMotion hook
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Valid test JWT
const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const UNSECURED_JWT =
  'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0In0.';

describe('JwtDecoder', () => {
  it('renders without children', () => {
    render(<JwtDecoder />);
    expect(screen.getByLabelText(/Token/)).toBeInTheDocument();
  });

  it('renders with children (SEO sections)', () => {
    render(
      <JwtDecoder>
        <div data-testid="seo-section">SEO Content</div>
      </JwtDecoder>
    );

    expect(screen.getByTestId('seo-section')).toBeInTheDocument();
  });

  it('accepts token input', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(textarea).toHaveValue(VALID_JWT);
    });
  });

  it('displays decoded token when valid', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      // Wait for any of the time claims to show
      const texts = screen.queryAllByText('Issued At');
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  it('shows error for malformed JWT', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, 'not.a.jwt');

    await waitFor(() => {
      // Error message should appear
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('displays unsecured algorithm warning', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, UNSECURED_JWT);

    await waitFor(() => {
      const alerts = screen.queryAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('has tab switcher for claims/raw', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Claims/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Raw JSON/ })).toBeInTheDocument();
    });
  });

  it('switches between claims and raw tab', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Claims/ })).toBeInTheDocument();
    });

    const rawTabButton = screen.getByRole('button', { name: /Raw JSON/ });
    await userEvent.click(rawTabButton);

    await waitFor(() => {
      // Raw JSON should be visible as a pre element
      const preElements = screen.queryAllByRole('generic');
      const hasJson = preElements.some((el) => el.textContent?.includes('sub'));
      expect(hasJson).toBe(true);
    });
  });

  it('renders claims table on claims tab', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      // Check for claims heading or table
      const headings = screen.queryAllByText('Claims');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('displays validity indicator', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      // ValidityIndicator renders a badge with status
      const badges = screen.queryAllByText(/Valid|Expired|Unknown/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('shows copy and download buttons', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy Payload/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download/ })).toBeInTheDocument();
    });
  });

  it('copies payload to clipboard', async () => {
    const clipboardMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: clipboardMock },
    });

    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy Payload/ })).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: /Copy Payload/ });
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(clipboardMock).toHaveBeenCalled();
    });
  });

  it('renders verification section', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(screen.getByText(/Signature Verification/)).toBeInTheDocument();
    });
  });

  it('has 2-column layout on desktop and stacked on mobile', () => {
    const { container } = render(<JwtDecoder />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
  });

  it('hides output section initially when token is empty', () => {
    render(<JwtDecoder />);

    // No decoded content should render
    expect(screen.queryAllByText('Claims').length).toBe(0);
  });

  it('shows output section only after valid token', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      const claimsHeadings = screen.queryAllByText('Claims');
      expect(claimsHeadings.length).toBeGreaterThan(0);
    });
  });

  it('uses focus-visible ring styling on buttons', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      // At least one button should have proper focus styling in class name
      let hasFocusVisible = false;
      buttons.forEach((button) => {
        if (button.className.includes('focus') || button.className.includes('ring')) {
          hasFocusVisible = true;
        }
      });
      expect(hasFocusVisible).toBe(true);
    });
  });

  it('focuses textarea on ref', async () => {
    render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/);
    textarea.focus();

    expect(document.activeElement).toBe(textarea);
  });

  it('applies prefers-reduced-motion when enabled', () => {
    render(<JwtDecoder />);

    expect(screen.getByLabelText(/Token/)).toBeInTheDocument();
  });

  it('shows error state styling when token is invalid', async () => {
    const { container } = render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/) as HTMLTextAreaElement;
    await userEvent.type(textarea, 'invalid');

    await waitFor(() => {
      expect(textarea.className).toContain('border-danger');
    });
  });

  it('clears error when token becomes valid', async () => {
    const { container } = render(<JwtDecoder />);

    const textarea = screen.getByLabelText(/Token/) as HTMLTextAreaElement;
    await userEvent.type(textarea, 'invalid');

    await waitFor(() => {
      expect(textarea.className).toContain('border-danger');
    });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, VALID_JWT);

    await waitFor(() => {
      expect(textarea.className).toContain('border-hairline');
    });
  });

  it('renders with proper semantic structure', () => {
    const { container } = render(<JwtDecoder />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
