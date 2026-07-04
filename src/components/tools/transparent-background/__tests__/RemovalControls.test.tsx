import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { RemovalControls } from '../RemovalControls';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('RemovalControls', () => {
  const mockCallbacks = {
    onToleranceChange: vi.fn(),
    onFeatherChange: vi.fn(),
    onModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tolerance slider with label and aria-valuetext', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={2}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    const toleranceSlider = screen.getByLabelText(
      messages.ko.tools['transparent-background'].controls.toleranceLabel
    ) as HTMLInputElement;

    expect(toleranceSlider).toHaveAttribute('type', 'range');
    expect(toleranceSlider).toHaveAttribute('aria-valuetext', '50%');
    expect(toleranceSlider.value).toBe('50');
  });

  it('renders feather slider with aria-valuetext', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={5}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    const featherSlider = screen.getByLabelText(
      messages.ko.tools['transparent-background'].controls.featherLabel
    ) as HTMLInputElement;

    expect(featherSlider).toHaveAttribute('type', 'range');
    expect(featherSlider).toHaveAttribute('aria-valuetext', '5px');
    expect(featherSlider.value).toBe('5');
  });

  it('calls onToleranceChange when tolerance slider changes', () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={2}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    const toleranceSlider = screen.getByLabelText(
      messages.ko.tools['transparent-background'].controls.toleranceLabel
    ) as HTMLInputElement;

    fireEvent.change(toleranceSlider, { target: { value: '75' } });
    expect(mockCallbacks.onToleranceChange).toHaveBeenCalledWith(75);
  });

  it('calls onFeatherChange when feather slider changes', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={2}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    const featherSlider = screen.getByLabelText(
      messages.ko.tools['transparent-background'].controls.featherLabel
    ) as HTMLInputElement;

    fireEvent.change(featherSlider, { target: { value: '10' } });
    expect(mockCallbacks.onFeatherChange).toHaveBeenCalledWith(10);
  });

  it('renders mode selector pills and calls onModeChange', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={2}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    const floodFillBtn = screen.getByRole('button', {
      name: messages.ko.tools['transparent-background'].controls.modeFloodFill,
    });
    const globalBtn = screen.getByRole('button', {
      name: messages.ko.tools['transparent-background'].controls.modeGlobal,
    });

    expect(floodFillBtn).toHaveAttribute('aria-pressed', 'true');
    expect(globalBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(globalBtn);
    expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('global');
  });

  it('uses the contrast-safe accent-ink token (not the raw ~2.1:1 accent) for value labels', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={2}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    // --accent-sky is documented at ~2.14:1 on white (fails WCAG AA 4.5:1);
    // --accent-sky-ink is the token built for text use (~5.95:1). CSS class
    // selectors match whole tokens, so this only matches the raw (unsafe) class.
    const rawAccentTextNodes = container.querySelectorAll('.text-accent-sky');
    expect(rawAccentTextNodes.length).toBe(0);

    const valueLabels = container.querySelectorAll('.text-accent-sky-ink');
    expect(valueLabels.length).toBe(2); // tolerance value + feather value
  });

  it('displays help text when flood-fill mode is selected', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RemovalControls
          tolerance={50}
          onToleranceChange={mockCallbacks.onToleranceChange}
          feather={2}
          onFeatherChange={mockCallbacks.onFeatherChange}
          mode="flood-fill"
          onModeChange={mockCallbacks.onModeChange}
        />
      </NextIntlClientProvider>
    );

    expect(container.textContent).toContain(messages.ko.tools['transparent-background'].controls.modeFloodFillHelp);
  });
});
