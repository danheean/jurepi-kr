import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

/**
 * Test component that uses useTheme hook
 */
function TestComponent() {
  const { pref, resolved, setPref } = useTheme();

  return (
    <div>
      <span data-testid="pref">{pref}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={() => setPref('light')} data-testid="btn-light">
        Light
      </button>
      <button onClick={() => setPref('dark')} data-testid="btn-dark">
        Dark
      </button>
      <button onClick={() => setPref('system')} data-testid="btn-system">
        System
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
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

  it('provides default theme preference as "light"', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for component to mount and read localStorage
    expect(screen.getByTestId('pref')).toHaveTextContent('light');
  });

  it('resolves default preference to "light" when system prefers light', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('updates pref when setPref is called', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const btn = screen.getByTestId('btn-dark');
    fireEvent.click(btn);

    expect(screen.getByTestId('pref')).toHaveTextContent('dark');
  });

  it('flips resolved to "dark" when setPref("dark") is called', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-dark'));

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('sets document.documentElement.dataset.theme on pref change', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-dark'));

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('persists pref to localStorage on setPref', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-dark'));

    expect(localStorage.getItem('jurepi-theme')).toBe('dark');
  });

  it('throws error when useTheme is called outside ThemeProvider', () => {
    function BadComponent() {
      useTheme(); // This should throw
      return <div>Bad</div>;
    }

    // Suppress console error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useTheme must be used within ThemeProvider');

    spy.mockRestore();
  });
});
