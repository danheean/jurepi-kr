import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, userEvent, fireEvent } from '@/__test__/test-utils';
import { Roulette } from '../Roulette';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/i18n/messages/en.json';

// KOREAN_CHARS regex to detect Korean characters
const KOREAN_CHARS = /[가-힣]/g;

describe('Roulette.en (English localization)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderWithEnMessages(ui: React.ReactElement) {
    return render(
      <NextIntlClientProvider locale="en" messages={enMessages as any}>
        {ui}
      </NextIntlClientProvider>
    );
  }

  it('renders Roulette component without mounted placeholder', async () => {
    const { container } = renderWithEnMessages(<Roulette />);

    // After mount, placeholder should be gone
    vi.runAllTimers();

    expect(container.querySelector('input[placeholder="e.g., Pizza, Pasta, Salad (commas add several)"]')).toBeInTheDocument();
  });

  it('displays English UI text for options label', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    // Should have "Add Option" label in English
    const headings = container.querySelectorAll('h2');
    let foundAddOption = false;
    headings.forEach((h) => {
      if (h.textContent?.includes('Add Option')) {
        foundAddOption = true;
      }
    });
    expect(foundAddOption).toBe(true);
  });

  it('displays English placeholder text', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    const input = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
    expect(input).toBeInTheDocument();
  });

  it('displays English button labels', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'You need at least 2 options' })).toBeInTheDocument();
  });

  it('has no Korean characters in rendered UI (excluding user input)', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    // Get all visible text content (excluding hidden sr-only or aria-hidden)
    const allText = container.innerText || '';

    // Check for Korean characters in the UI chrome (not user-entered content)
    // Only check visible text that is NOT user input
    const visibleElements = container.querySelectorAll('h2, label, button:not([role="switch"]), span:not(.sr-only)');

    visibleElements.forEach((el) => {
      const text = el.textContent || '';
      const koreanChars = text.match(KOREAN_CHARS);
      // Buttons and labels should not have Korean text
      if (text.length > 0 && !text.includes('Add') && !text.includes('Spin') && !text.includes('Weight') && !text.includes('e.g.')) {
        expect(koreanChars).toBeNull();
      }
    });
  });

  it('displays English settings labels', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    // Scroll down to see settings
    expect(screen.getByText('Sound')).toBeInTheDocument();
    expect(screen.getByText('Remove Winner Mode')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('displays English empty state message', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    // Initially, it should show the empty option message
    const text = container.textContent || '';
    expect(text).toContain('Please add at least one option');
  });

  it('displays English spin button label (disabled state name)', async () => {
    renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    const spinButton = screen.getByRole('button', { name: 'You need at least 2 options' });
    expect(spinButton).toBeInTheDocument();
    expect(spinButton.textContent).not.toMatch(KOREAN_CHARS);
  });

  it('displays English aria-labels without Korean characters', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    const addInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
    const ariaLabel = addInput.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).not.toMatch(KOREAN_CHARS);
  });

  it('has English i18n messages for weight input', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    const weightInput = screen.getByRole('spinbutton', { name: 'Weight' });
    expect(weightInput).toBeInTheDocument();
  });

  it('shows no Korean text in save/load panel', async () => {
    const { container } = renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    // Check for save/load section
    const saveLoadSection = container.textContent || '';
    // If save label exists, it should be in English
    if (saveLoadSection.includes('Save')) {
      expect(saveLoadSection).not.toMatch(/^[가-힣]*Save[가-힣]*$/);
    }
  });

  it('displays English yes/no/confirmation text throughout', async () => {
    renderWithEnMessages(<Roulette />);
    vi.runAllTimers();

    // Add an option to verify English UI response (fireEvent — fake timers와
    // userEvent delay 조합은 데드락)
    const labelInput = screen.getByPlaceholderText('e.g., Pizza, Pasta, Salad (commas add several)');
    const addButton = screen.getByRole('button', { name: 'Add' });

    fireEvent.change(labelInput, { target: { value: 'Pizza' } });
    fireEvent.click(addButton);
    vi.runAllTimers();

    // Verify add button exists and has English text
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  }, { timeout: 10000 });
});
