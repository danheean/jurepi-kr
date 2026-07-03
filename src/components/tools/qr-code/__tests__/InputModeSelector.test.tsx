import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { InputModeSelector } from '../InputModeSelector';
import { InputMode } from '@/lib/qr-code/types';

const messages = {
  tools: {
    'qr-code': {
      modes: {
        label: 'Input Mode',
        text: 'Text',
        url: 'URL',
        wifi: 'Wi-Fi',
        vcard: 'vCard',
        email: 'Email',
        sms: 'SMS',
      },
    },
  },
};

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('InputModeSelector', () => {
  it('renders all mode tabs', () => {
    const onChange = vi.fn();
    renderWithProvider(
      <InputModeSelector mode="text" onModeChange={onChange} />
    );

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    expect(screen.getByText('vCard')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('marks active mode with aria-selected', () => {
    const onChange = vi.fn();
    renderWithProvider(
      <InputModeSelector mode="wifi" onModeChange={onChange} />
    );

    const buttons = screen.getAllByRole('tab');
    const wifiButton = buttons.find((btn) => btn.textContent === 'Wi-Fi');

    expect(wifiButton).toHaveAttribute('aria-selected', 'true');
    buttons.forEach((btn) => {
      if (btn !== wifiButton) {
        expect(btn).toHaveAttribute('aria-selected', 'false');
      }
    });
  });

  it('calls onChange when tab is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProvider(
      <InputModeSelector mode="text" onModeChange={onChange} />
    );

    const urlTab = screen.getByText('URL');
    await user.click(urlTab);

    expect(onChange).toHaveBeenCalledWith('url');
  });

  it('navigates with arrow keys', () => {
    let currentMode: InputMode = 'text';
    const onChange = vi.fn((mode: InputMode) => {
      currentMode = mode;
    });
    renderWithProvider(
      <InputModeSelector mode={currentMode} onModeChange={onChange} />
    );

    const tablist = screen.getByRole('tablist');

    // ArrowRight should move from text (0) to url (1)
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('url');
  });

  it('applies correct styles to active tab', () => {
    const onChange = vi.fn();
    renderWithProvider(
      <InputModeSelector mode="text" onModeChange={onChange} />
    );

    const buttons = screen.getAllByRole('tab');
    const textButton = buttons[0];

    expect(textButton).toHaveClass('bg-brand');
    expect(textButton).toHaveClass('text-on-brand');
  });

  it('applies correct styles to inactive tabs', () => {
    const onChange = vi.fn();
    renderWithProvider(
      <InputModeSelector mode="text" onModeChange={onChange} />
    );

    const buttons = screen.getAllByRole('tab');
    const urlButton = buttons[1];

    expect(urlButton).toHaveClass('bg-surface-muted');
    expect(urlButton).toHaveClass('text-text-secondary');
  });

  it('has proper focus-visible styling', () => {
    const onChange = vi.fn();
    renderWithProvider(
      <InputModeSelector mode="text" onModeChange={onChange} />
    );

    const buttons = screen.getAllByRole('tab');
    expect(buttons[0]).toHaveClass('focus-visible:ring-2');
  });
});
