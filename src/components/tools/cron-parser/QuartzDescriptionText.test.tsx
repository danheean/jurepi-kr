import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/__test__/test-utils';
import { QuartzDescriptionText } from './QuartzDescriptionText';
import { QuartzDescriptionModel } from '@/lib/cron-parser';

describe('QuartzDescriptionText', () => {
  it('renders everySecond frequency kind', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'everySecond',
    };

    const { container } = render(<QuartzDescriptionText model={model} />);

    // Should render in a div with proper styling
    const div = container.querySelector('div');
    expect(div).toHaveClass('bg-surface-sunken');
  });

  it('renders everyNSeconds with interpolation', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'everyNSeconds',
      atTimes: undefined,
    };

    const { container } = render(<QuartzDescriptionText model={model} />);

    // Should have the component rendered with proper div
    const div = container.querySelector('div');
    expect(div).toHaveClass('bg-surface-sunken');
  });

  it('renders atTimes with formatted times', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'everyDay',
      atTimes: [
        { hour: 9, minute: 30, second: 0 },
        { hour: 14, minute: 0, second: 0 },
      ],
    };

    render(<QuartzDescriptionText model={model} />);

    // Component should render without error
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('renders with custom frequency kind', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'custom',
      onMonths: ['Jan', 'Feb'],
      years: [2024, 2025],
    };

    const { container } = render(<QuartzDescriptionText model={model} />);

    // Should render a div with proper styling
    const div = container.querySelector('div');
    expect(div).toHaveClass('bg-surface-sunken');
  });

  it('renders with dom and dow specs', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'custom',
      domKind: 'specific',
      domDetail: { dates: [1, 15] },
      dowKind: 'specific',
      dowDetail: { days: ['MON', 'FRI'] },
    };

    render(<QuartzDescriptionText model={model} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('renders with lastDay dom kind', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'custom',
      domKind: 'lastDay',
    };

    render(<QuartzDescriptionText model={model} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('renders with nth dow kind', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'custom',
      dowKind: 'nth',
      dowDetail: { nth: { day: 'FRI', n: 3 } },
    };

    render(<QuartzDescriptionText model={model} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('renders with proper styling (rounded bg-surface-sunken)', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'everyMinute',
    };

    const { container } = render(<QuartzDescriptionText model={model} />);

    const div = container.querySelector('div');
    expect(div).toHaveClass('rounded-lg', 'bg-surface-sunken', 'border', 'border-hairline', 'p-4');
  });

  it('renders text with font-medium styling', () => {
    const model: QuartzDescriptionModel = {
      frequencyKind: 'everyHour',
    };

    const { container } = render(<QuartzDescriptionText model={model} />);

    const p = container.querySelector('p');
    expect(p).toHaveClass('font-medium', 'text-text');
  });

  // Behavioral guards: the base templates for everyNSeconds / everyNMinutes carry
  // an ICU {n} that MUST be filled, and a wildcard day-of-month must NOT render
  // as "on day 1, 2, …, 31". The styling-only tests above missed all of this.
  describe('rendered text (no broken placeholders or noise clauses)', () => {
    it('fills {n} for everyNSeconds instead of showing the literal "{n}"', () => {
      const { container } = render(
        <QuartzDescriptionText
          model={{
            frequencyKind: 'everyNSeconds',
            intervalSeconds: 30,
            domKind: 'noSpecific',
            dowKind: 'noSpecific',
          }}
        />
      );
      const text = container.querySelector('p')?.textContent ?? '';
      expect(text).not.toContain('{');
      expect(text).toContain('30');
    });

    it('has a catalog key for everyNMinutes and fills {n} (no MISSING_MESSAGE)', () => {
      const { container } = render(
        <QuartzDescriptionText
          model={{
            frequencyKind: 'everyNMinutes',
            intervalMinutes: 5,
            domKind: 'noSpecific',
            dowKind: 'noSpecific',
          }}
        />
      );
      const text = container.querySelector('p')?.textContent ?? '';
      expect(text).not.toContain('{');
      expect(text).not.toContain('quartzDescriptions'); // raw key path = MISSING_MESSAGE
      expect(text).toContain('5');
    });

    it('does not append a "1, 2, 3, …" clause when the model has no specific day', () => {
      const { container } = render(
        <QuartzDescriptionText
          model={{
            frequencyKind: 'everyNSeconds',
            intervalSeconds: 30,
            domKind: 'noSpecific',
            dowKind: 'noSpecific',
          }}
        />
      );
      const text = container.querySelector('p')?.textContent ?? '';
      expect(text).not.toMatch(/1,\s*2,\s*3/);
    });
  });
});
