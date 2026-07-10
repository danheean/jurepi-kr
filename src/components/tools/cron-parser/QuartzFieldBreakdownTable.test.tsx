import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/__test__/test-utils';
import { QuartzFieldBreakdownTable } from './QuartzFieldBreakdownTable';
import { QuartzFields } from '@/lib/cron-parser';

describe('QuartzFieldBreakdownTable', () => {
  it('renders 6 columns when hasYear is false', () => {
    const fields: QuartzFields = {
      second: [0],
      minute: [0],
      hour: [9],
      dom: { values: [1], noSpecific: false, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      hasYear: false,
      isValid: true,
    };

    const { container } = render(<QuartzFieldBreakdownTable fields={fields} />);

    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(6);
  });

  it('renders 7 columns when hasYear is true', () => {
    const fields: QuartzFields = {
      second: [0],
      minute: [0],
      hour: [9],
      dom: { values: [1], noSpecific: false, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      year: [2024, 2025],
      hasYear: true,
      isValid: true,
    };

    const { container } = render(<QuartzFieldBreakdownTable fields={fields} />);

    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(7);
  });

  it('renders full range values as "All"', () => {
    const fields: QuartzFields = {
      second: Array.from({ length: 60 }, (_, i) => i),
      minute: [0],
      hour: [9],
      dom: { values: [1], noSpecific: false, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      hasYear: false,
      isValid: true,
    };

    render(<QuartzFieldBreakdownTable fields={fields} />);

    // Should show All for second field (60 values, range 0-59)
    const rows = screen.getAllByRole('row');
    const secondCell = rows[1].querySelectorAll('td')[0];
    expect(secondCell).toHaveTextContent('All');
  });

  it('renders partial values with ellipsis if > 10', () => {
    const values = Array.from({ length: 15 }, (_, i) => i);
    const fields: QuartzFields = {
      second: values,
      minute: [0],
      hour: [9],
      dom: { values: [1], noSpecific: false, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      hasYear: false,
      isValid: true,
    };

    render(<QuartzFieldBreakdownTable fields={fields} />);

    const rows = screen.getAllByRole('row');
    const secondCell = rows[1].querySelectorAll('td')[0];
    expect(secondCell.textContent).toContain('…');
  });

  it('renders dom spec with "?" for noSpecific', () => {
    const fields: QuartzFields = {
      second: [0],
      minute: [0],
      hour: [9],
      dom: { values: [], noSpecific: true, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      hasYear: false,
      isValid: true,
    };

    render(<QuartzFieldBreakdownTable fields={fields} />);

    const rows = screen.getAllByRole('row');
    const domCell = rows[1].querySelectorAll('td')[3];
    expect(domCell).toHaveTextContent('?');
  });

  it('renders dom spec with "L" for lastDay', () => {
    const fields: QuartzFields = {
      second: [0],
      minute: [0],
      hour: [9],
      dom: { values: [], noSpecific: false, lastDay: true, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      hasYear: false,
      isValid: true,
    };

    render(<QuartzFieldBreakdownTable fields={fields} />);

    const rows = screen.getAllByRole('row');
    const domCell = rows[1].querySelectorAll('td')[3];
    expect(domCell).toHaveTextContent('L');
  });

  it('renders dow spec with "?" for noSpecific', () => {
    const fields: QuartzFields = {
      second: [0],
      minute: [0],
      hour: [9],
      dom: { values: [1], noSpecific: false, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [], noSpecific: true },
      hasYear: false,
      isValid: true,
    };

    render(<QuartzFieldBreakdownTable fields={fields} />);

    const rows = screen.getAllByRole('row');
    const dowCell = rows[1].querySelectorAll('td')[5];
    expect(dowCell).toHaveTextContent('?');
  });

  it('renders table with proper accessibility structure', () => {
    const fields: QuartzFields = {
      second: [0],
      minute: [0],
      hour: [9],
      dom: { values: [1], noSpecific: false, lastDay: false, lastWeekday: false },
      month: [1, 2, 3],
      dow: { values: [1, 2, 3, 4, 5], noSpecific: false },
      hasYear: false,
      isValid: true,
    };

    render(<QuartzFieldBreakdownTable fields={fields} />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Should have proper thead/tbody structure
    const thead = table.querySelector('thead');
    expect(thead).toBeInTheDocument();

    const tbody = table.querySelector('tbody');
    expect(tbody).toBeInTheDocument();
  });
});
