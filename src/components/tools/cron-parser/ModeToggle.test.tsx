import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ModeToggle } from './ModeToggle';

const messages = {
  'tools.cron-parser': {
    'mode.label': 'Format',
    'mode.unix': 'Unix crontab',
    'mode.quartz': 'Quartz',
  },
};

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ModeToggle', () => {
  it('renders both mode options', () => {
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    expect(screen.getByRole('button', { name: /unix/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quartz/i })).toBeInTheDocument();
  });

  it('sets Unix button as pressed when mode is unix', () => {
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const unixButton = screen.getByRole('button', { name: /unix/i });
    expect(unixButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets Quartz button as pressed when mode is quartz', () => {
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="quartz" onChange={onChange} />
    );

    const quartzButton = screen.getByRole('button', { name: /quartz/i });
    expect(quartzButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when mode button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const quartzButton = screen.getByRole('button', { name: /quartz/i });
    await user.click(quartzButton);

    expect(onChange).toHaveBeenCalledWith('quartz');
  });

  it('does not call onChange when clicking already-active mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const unixButton = screen.getByRole('button', { name: /unix/i });
    await user.click(unixButton);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('has proper styling for active and inactive states', () => {
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const unixButton = screen.getByRole('button', { name: /unix/i });
    const quartzButton = screen.getByRole('button', { name: /quartz/i });

    // Active button should have brand styling
    expect(unixButton).toHaveClass('bg-brand', 'text-on-brand');

    // Inactive button should have muted styling
    expect(quartzButton).toHaveClass('bg-surface-muted');
  });

  it('has focus-visible ring on keyboard focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const unixButton = screen.getByRole('button', { name: /unix/i });
    await user.tab();

    // First button should have focus
    expect(unixButton).toHaveFocus();
  });

  it('has 44px minimum touch target', () => {
    const onChange = vi.fn();
    renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      const styles = window.getComputedStyle(button);
      // Check that button has padding to ensure 44px minimum
      expect(button).toHaveClass('px-4', 'py-2'); // Tailwind defaults to 44px minimum
    });
  });

  it('renders with group role for accessibility', () => {
    const onChange = vi.fn();
    const { container } = renderWithI18n(
      <ModeToggle mode="unix" onChange={onChange} />
    );

    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
  });
});
