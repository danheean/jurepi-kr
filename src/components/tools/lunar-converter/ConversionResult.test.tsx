import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { ConversionResult } from './ConversionResult';
import type { ConversionResult as ConversionResultType } from '@/lib/lunar-converter/schema';

const mockMessages = koMessages as Record<string, any>;

function renderWithI18n(component: React.ReactElement, locale: string = 'ko') {
  return render(
    <NextIntlClientProvider locale={locale} messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('ConversionResult', () => {
  const mockResult: ConversionResultType = {
    solarDate: { year: 2024, month: 3, day: 15 },
    lunarDate: { year: 2024, month: 2, day: 6, isLeap: true },
    sexagenary: {
      name: '갑진',
      hanja: '甲辰',
      english: 'Wood Dragon',
      stemIndex: 0,
      branchIndex: 4,
    },
    zodiac: {
      key: 'dragon',
      emoji: '🐉',
      branchIndex: 4,
    },
  };

  const mockOnCopy = vi.fn();

  it('renders null when result is null', () => {
    const { container } = renderWithI18n(
      <ConversionResult result={null} onCopy={mockOnCopy} copyKey={null} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays solar date', () => {
    renderWithI18n(
      <ConversionResult result={mockResult} onCopy={mockOnCopy} copyKey={null} />
    );

    expect(screen.getByText(/3월 15/)).toBeInTheDocument();
  });

  it('displays lunar date with leap month indicator', () => {
    renderWithI18n(
      <ConversionResult result={mockResult} onCopy={mockOnCopy} copyKey={null} />
    );

    expect(screen.getByText(/2024년 2월 6일.*윤/)).toBeInTheDocument();
  });

  it('displays sexagenary name and hanja', () => {
    renderWithI18n(
      <ConversionResult result={mockResult} onCopy={mockOnCopy} copyKey={null} />
    );

    expect(screen.getByText('갑진')).toBeInTheDocument();
    expect(screen.getByText('甲辰')).toBeInTheDocument();
    expect(screen.getByText('Wood Dragon')).toBeInTheDocument();
  });

  it('displays zodiac emoji', () => {
    renderWithI18n(
      <ConversionResult result={mockResult} onCopy={mockOnCopy} copyKey={null} />
    );

    expect(screen.getByText('🐉')).toBeInTheDocument();
  });

  it('calls onCopy when copy buttons clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithI18n(
      <ConversionResult result={mockResult} onCopy={mockOnCopy} copyKey={null} />
    );

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThanOrEqual(3); // solar, lunar, both

    // Click first button (solar)
    await user.click(buttons[0]);
    expect(mockOnCopy).toHaveBeenCalledWith('solar');

    // Click second button (lunar)
    await user.click(buttons[1]);
    expect(mockOnCopy).toHaveBeenCalledWith('lunar');

    // Click last button (both)
    await user.click(buttons[buttons.length - 1]);
    expect(mockOnCopy).toHaveBeenCalledWith('both');
  });

  it('shows success state when copyKey matches', () => {
    const { container } = renderWithI18n(
      <ConversionResult result={mockResult} onCopy={mockOnCopy} copyKey="solar" />
    );

    // When copyKey is 'solar', the first copy button should have success styling
    const firstCopyButton = container.querySelector('button');
    expect(firstCopyButton).toHaveClass('bg-success');
  });

  it('handles result without leap month', () => {
    const nonLeapResult: ConversionResultType = {
      ...mockResult,
      lunarDate: { year: 2024, month: 3, day: 16, isLeap: false },
    };

    renderWithI18n(
      <ConversionResult result={nonLeapResult} onCopy={mockOnCopy} copyKey={null} />
    );

    const lunarText = screen.getByText(/2024년 3월 16일/);
    expect(lunarText.textContent).not.toContain('윤');
  });
});
