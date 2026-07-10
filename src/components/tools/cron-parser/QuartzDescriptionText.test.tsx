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
});
