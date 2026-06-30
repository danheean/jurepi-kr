import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/__test__/test-utils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      length: 0,
      key: () => null,
    } as Storage;

    // Mock matchMedia to simulate system light preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme:dark)' ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Reset DOM
    document.documentElement.dataset.theme = 'light';
  });

  it('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');
    expect(button).toBeInTheDocument();
  });

  it('shows Sun icon when pref is light', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');
    // Sun icon is rendered as SVG with specific viewBox
    const svg = button.querySelector('svg[class*="w-5"]');
    expect(svg).toBeInTheDocument();
  });

  it('cycles through light → dark → system → light on clicks', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');

    // Initial: light
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light'));

    // Click 1: light → dark
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dark'));

    // Click 2: dark → system
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('System'));

    // Click 3: system → light
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light'));
  });

  it('aria-label contains the current theme state', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');

    // Verify aria-label format: "Toggle theme (Light)" or similar
    const ariaLabel = button.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Toggle theme \(.+\)/);
  });

  it('aria-label updates when theme preference changes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');

    // Start with Light
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light'));

    // Click to change to Dark
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dark'));
  });

  it('has keyboard accessibility with focus ring', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');
    expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
  });
});
