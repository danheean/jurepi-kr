import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { BackgroundColorPicker } from '../BackgroundColorPicker';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('BackgroundColorPicker', () => {
  const mockCallbacks = {
    onColorChange: vi.fn(),
    onAutoDetect: vi.fn().mockResolvedValue(undefined),
    onEyedropperMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders label and control buttons', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 255, g: 255, b: 255 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(messages.ko.tools['transparent-background'].colorPicker.label)).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: new RegExp(messages.ko.tools['transparent-background'].colorPicker.autoDetect)
    })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: new RegExp(messages.ko.tools['transparent-background'].colorPicker.eyedropper)
    })).toBeInTheDocument();
  });

  it('renders hex color input', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 255, g: 0, b: 0 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const hexInput = screen.getByDisplayValue('#ff0000') as HTMLInputElement;
    expect(hexInput).toBeInTheDocument();
    expect(hexInput.type).toBe('text');
  });

  it('renders current color swatch', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 100, g: 150, b: 200 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const swatch = container.querySelector('div[role="img"]');
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveStyle('background-color: #6496c8');
  });

  it('gives the color swatch a localized aria-label (not a hardcoded English string)', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <BackgroundColorPicker
          bgColor={{ r: 100, g: 150, b: 200 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const swatch = container.querySelector('div[role="img"]');
    expect(swatch).toHaveAttribute(
      'aria-label',
      `${messages.en.tools['transparent-background'].colorPicker.currentColor}: #6496c8`
    );
  });

  it('does not hardcode the English swatch label in the Korean locale', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 100, g: 150, b: 200 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const swatch = container.querySelector('div[role="img"]');
    expect(swatch?.getAttribute('aria-label')).not.toMatch(/Current color/i);
    expect(swatch).toHaveAttribute(
      'aria-label',
      `${messages.ko.tools['transparent-background'].colorPicker.currentColor}: #6496c8`
    );
  });

  it('calls onAutoDetect when auto-detect button is clicked', async () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 255, g: 255, b: 255 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const autoDetectBtn = screen.getByRole('button', {
      name: new RegExp(messages.ko.tools['transparent-background'].colorPicker.autoDetect)
    });

    fireEvent.click(autoDetectBtn);
    expect(mockCallbacks.onAutoDetect).toHaveBeenCalled();
  });

  it('calls onEyedropperMode when eyedropper button is clicked', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 255, g: 255, b: 255 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const eyedropperBtn = screen.getByRole('button', {
      name: new RegExp(messages.ko.tools['transparent-background'].colorPicker.eyedropper)
    });

    fireEvent.click(eyedropperBtn);
    expect(mockCallbacks.onEyedropperMode).toHaveBeenCalled();
  });

  it('updates color from hex input', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 255, g: 255, b: 255 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
        />
      </NextIntlClientProvider>
    );

    const hexInput = screen.getByDisplayValue('#ffffff') as HTMLInputElement;
    fireEvent.change(hexInput, { target: { value: '#ff0000' } });

    expect(mockCallbacks.onColorChange).toHaveBeenCalledWith(
      expect.objectContaining({ r: 255, g: 0, b: 0 })
    );
  });

  it('disables buttons when loading', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <BackgroundColorPicker
          bgColor={{ r: 255, g: 255, b: 255 }}
          onColorChange={mockCallbacks.onColorChange}
          onAutoDetect={mockCallbacks.onAutoDetect}
          onEyedropperMode={mockCallbacks.onEyedropperMode}
          isLoading={true}
        />
      </NextIntlClientProvider>
    );

    const autoDetectBtn = screen.getByRole('button', {
      name: new RegExp(messages.ko.tools['transparent-background'].colorPicker.autoDetect)
    }) as HTMLButtonElement;

    expect(autoDetectBtn.disabled).toBe(true);
  });
});
