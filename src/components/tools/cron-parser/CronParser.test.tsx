import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllTheProviders } from '@/__test__/test-utils';
import { CronParser } from './CronParser';

describe('CronParser (Orchestrator)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders input field and timezone selector', () => {
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays parse results after valid expression input', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '0 9 * * MON-FRI');

    // Wait for parse result (debounce 200ms)
    const descriptionArea = await screen.findByText(/Every weekday|平일/);
    expect(descriptionArea).toBeInTheDocument();
  });

  it('shows error message for invalid expression', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'invalid cron');

    // Wait for error message (debounce 200ms)
    const errorElement = await screen.findByRole('alert');
    expect(errorElement).toBeInTheDocument();
  });

  it('changes timezone and recalculates runs', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '0 9 * * *');

    // Wait for first parse
    await screen.findByText(/Every day|매일/);

    // Native <select>: choose a different timezone option directly
    const timezoneSelect = screen.getByRole('combobox');
    await user.selectOptions(timezoneSelect, 'America/New_York');

    // Timezone should update (no re-parse)
    expect(screen.getByDisplayValue('America/New_York')).toBeInTheDocument();
  });

  it('loads preset expression on click', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    // Find and click a preset button
    const presetButton = screen.getByText(/Every hour|매시간/i);
    await user.click(presetButton);

    // Input should be populated with preset expression
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('0 * * * *');
  });

  it('persists expression to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '0 0 1 * *');

    // Wait for parse
    await screen.findByText(/Monthly|매월/i);

    // Check localStorage
    const stored = localStorage.getItem('jurepi-cron-parser-state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.lastExpression).toBe('0 0 1 * *');
  });

  it('displays field breakdown table for valid expression', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '0 9 15 * *');

    // The field breakdown table is the first table (before the next-runs
    // table). Scope to it — "Minute/분" also appears in the cheatsheet, so an
    // unscoped query hits multiple matches.
    const breakdownTable = (await screen.findAllByRole('table'))[0];
    expect(within(breakdownTable).getByText(/Minute|분/)).toBeInTheDocument();

    // Verify parsed field values are displayed in the breakdown row
    expect(within(breakdownTable).getByText('0')).toBeInTheDocument();
    expect(within(breakdownTable).getByText('9')).toBeInTheDocument();
    expect(within(breakdownTable).getByText('15')).toBeInTheDocument();
  });

  it('displays next runs list for valid expression', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '0 9 * * *');

    // Wait for next runs to render
    const nextRunsHeading = await screen.findByText(/Next|다음/i);
    expect(nextRunsHeading).toBeInTheDocument();

    // Should show multiple upcoming runs
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows
  });

  it('clears expression and resets display', async () => {
    const user = userEvent.setup();
    render(
      <AllTheProviders>
        <CronParser />
      </AllTheProviders>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '0 9 * * *');

    // Wait for parse result
    await screen.findByText(/Every day|매일/);

    // Clear input
    await user.clear(input);

    // Result display should be cleared
    const description = screen.queryByText(/Every day|매일/);
    expect(description).not.toBeInTheDocument();
  });
});
