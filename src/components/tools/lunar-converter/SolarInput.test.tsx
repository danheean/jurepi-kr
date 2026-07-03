import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { SolarInput } from './SolarInput';

const mockMessages = koMessages as Record<string, any>;

function renderWithI18n(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('SolarInput', () => {
  const mockOnChange = vi.fn();

  it('renders year, month, and day dropdowns', () => {
    renderWithI18n(
      <SolarInput year={2024} month={3} day={15} onChange={mockOnChange} />
    );

    expect(screen.getByLabelText('연도')).toBeInTheDocument();
    expect(screen.getByLabelText('월')).toBeInTheDocument();
    expect(screen.getByLabelText('일')).toBeInTheDocument();
  });

  it('displays correct year range (1391-2050)', () => {
    renderWithI18n(
      <SolarInput year={0} month={0} day={0} onChange={mockOnChange} />
    );

    const yearSelect = screen.getByLabelText('연도') as HTMLSelectElement;
    const options = yearSelect.querySelectorAll('option');
    // +1 for the placeholder "선택" option
    expect(options).toHaveLength(2050 - 1391 + 2);
  });

  it('calls onChange when year is selected', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <SolarInput year={0} month={0} day={0} onChange={mockOnChange} />
    );

    const yearSelect = screen.getByLabelText('연도');
    await user.selectOptions(yearSelect, '2024');

    expect(mockOnChange).toHaveBeenCalledWith(2024, 0, 0);
  });

  it('calls onChange when month is selected', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <SolarInput year={2024} month={0} day={0} onChange={mockOnChange} />
    );

    const monthSelect = screen.getByLabelText('월');
    await user.selectOptions(monthSelect, '3');

    expect(mockOnChange).toHaveBeenCalledWith(2024, 3, 0);
  });

  it('limits days based on month (Feb has 28 days in non-leap year)', () => {
    renderWithI18n(
      <SolarInput year={2023} month={2} day={0} onChange={mockOnChange} />
    );

    const daySelect = screen.getByLabelText('일') as HTMLSelectElement;
    const options = daySelect.querySelectorAll('option');
    // 1-28 + placeholder = 29
    expect(options).toHaveLength(29);
  });

  it('allows 29 days in February for leap year', () => {
    renderWithI18n(
      <SolarInput year={2024} month={2} day={0} onChange={mockOnChange} />
    );

    const daySelect = screen.getByLabelText('일') as HTMLSelectElement;
    const options = daySelect.querySelectorAll('option');
    // 1-29 + placeholder = 30
    expect(options).toHaveLength(30);
  });

  it('displays selected values correctly', () => {
    renderWithI18n(
      <SolarInput year={2024} month={3} day={15} onChange={mockOnChange} />
    );

    const yearSelect = screen.getByLabelText('연도') as HTMLSelectElement;
    const monthSelect = screen.getByLabelText('월') as HTMLSelectElement;
    const daySelect = screen.getByLabelText('일') as HTMLSelectElement;

    expect(yearSelect.value).toBe('2024');
    expect(monthSelect.value).toBe('3');
    expect(daySelect.value).toBe('15');
  });

  it('has accessible focus styling', () => {
    renderWithI18n(
      <SolarInput year={0} month={0} day={0} onChange={mockOnChange} />
    );

    const yearSelect = screen.getByLabelText('연도');
    expect(yearSelect).toHaveClass('focus:ring-2');
  });
});
