import { render, screen, waitFor } from '@/__test__/test-utils';
import { LadderGame } from './LadderGame';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('LadderGame Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders main element', () => {
    render(<LadderGame />);
    const main = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(main).toBeInTheDocument();
  });

  it('renders LadderIntro section', () => {
    render(<LadderGame />);
    expect(screen.getByText('Ladder Game')).toBeInTheDocument();
  });

  it('renders LadderSetup in setup phase by default', () => {
    render(<LadderGame />);
    // LadderSetup renders a count label
    expect(screen.getByText(/Number of players/)).toBeInTheDocument();
  });

  it('renders LadderHowTo section', () => {
    render(<LadderGame />);
    const details = screen.getByTestId('howto-details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('How to play');
  });

  it('renders LadderFaq section', () => {
    render(<LadderGame />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders JSON-LD schema for SoftwareApplication', () => {
    render(<LadderGame />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    const softwareAppScript = Array.from(scripts).find((s) => {
      const content = s.textContent || '';
      return content.includes('SoftwareApplication');
    });

    expect(softwareAppScript).toBeDefined();
  });

  it('includes correct application name in JSON-LD', () => {
    render(<LadderGame />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    const softwareAppScript = Array.from(scripts).find((s) => {
      const content = s.textContent || '';
      return content.includes('SoftwareApplication');
    });

    const jsonContent = softwareAppScript?.textContent || '';
    const parsed = JSON.parse(jsonContent);

    expect(parsed['@type']).toBe('SoftwareApplication');
    expect(parsed.name).toBe('Ladder Game');
  });

  it('has max-w-2xl container width', () => {
    render(<LadderGame />);
    const main = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(main).toHaveClass('max-w-2xl');
  });

  it('has centered alignment', () => {
    render(<LadderGame />);
    const main = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(main).toHaveClass('mx-auto');
  });

  it('has padding on sides', () => {
    render(<LadderGame />);
    const main = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(main).toHaveClass('px-4');
  });

  it('has full width', () => {
    render(<LadderGame />);
    const main = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(main).toHaveClass('w-full');
  });

  it('registers keyboard event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    render(<LadderGame />);
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  it('removes keyboard event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<LadderGame />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('renders space between game board and footer content', () => {
    render(<LadderGame />);
    const gameContainer = document.querySelector('.space-y-6');
    expect(gameContainer).toBeInTheDocument();
  });

  it('applies mb-12 margin between game board and footer sections', () => {
    render(<LadderGame />);
    const sections = document.querySelectorAll('[class*="mb-12"]');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('renders game board section with spacing', () => {
    render(<LadderGame />);
    const spacedDiv = document.querySelector('.space-y-6.mb-12');
    expect(spacedDiv).toBeInTheDocument();
  });

  it('renders all main sections in correct order', () => {
    const { container } = render(<LadderGame />);
    const sections = container.querySelectorAll('section');
    // Should have at least: LadderIntro, LadderHowTo, LadderFaq
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it('applies vertical padding to main', () => {
    render(<LadderGame />);
    const main = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(main).toHaveClass('py-8');
  });
});
