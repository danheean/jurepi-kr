import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { DescriptionText } from './DescriptionText';
import type { DescriptionModel } from '@/lib/cron-parser';

function renderModel(model: DescriptionModel, locale = 'en') {
  return render(
    <AllTheProviders locale={locale}>
      <DescriptionText model={model} />
    </AllTheProviders>
  );
}

// Regression guard: the base templates for monthly/yearly/everyNMinutes carry ICU
// placeholders ({day}, {month}, {suffix}, {n}) that MUST be filled. When they are
// not, next-intl falls back to the raw string and literal braces reach the user.
describe('DescriptionText — no unfilled ICU placeholders reach the user', () => {
  it('renders "every N minutes" with the real interval, not "{n}"', () => {
    renderModel({ frequencyKind: 'everyNMinutes', intervalMinutes: 5 });
    const text = screen.getByText(/minutes/i).textContent ?? '';
    expect(text).not.toContain('{');
    expect(text).toContain('5');
  });

  it('renders a monthly schedule with the day filled in, not "{day}"', () => {
    renderModel({
      frequencyKind: 'monthly',
      onDatesOfMonth: [1],
      atTimes: [{ hour: 0, minute: 0 }],
    });
    const text = screen.getByText(/Monthly/i).textContent ?? '';
    expect(text).not.toContain('{');
    expect(text).toContain('1st');
  });

  it('renders a yearly schedule with the correct month, not "{month}" or the wrong month', () => {
    renderModel({
      frequencyKind: 'yearly',
      onDatesOfMonth: [25],
      onMonths: ['DEC'],
      atTimes: [{ hour: 0, minute: 0 }],
    });
    const text = screen.getByText(/Yearly/i).textContent ?? '';
    expect(text).not.toContain('{');
    expect(text).toContain('DEC');
    expect(text).toContain('25th');
    expect(text).not.toContain('JAN'); // the old parseInt() bug always yielded JAN
  });

  it('renders the actual day-of-week, not always SUN', () => {
    renderModel({
      frequencyKind: 'custom',
      onDays: ['MON'],
      atTimes: [{ hour: 9, minute: 0 }],
    });
    const text = screen.getByText(/MON/).textContent ?? '';
    expect(text).toContain('MON');
    expect(text).not.toContain('SUN');
  });

  it('drops the ordinal suffix for a list of dates (e.g. "1, 15", not "1, 15th")', () => {
    renderModel({
      frequencyKind: 'monthly',
      onDatesOfMonth: [1, 15],
      atTimes: [{ hour: 0, minute: 0 }],
    });
    const text = screen.getByText(/Monthly/i).textContent ?? '';
    expect(text).not.toContain('{');
    expect(text).toContain('1, 15');
    expect(text).not.toContain('15th');
  });
});
