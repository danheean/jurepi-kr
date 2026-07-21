import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { CheerControls } from './CheerControls';
import { DEFAULT_SETTINGS, CheerSettings } from '@/lib/cheer';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';

function renderWithIntl(component: React.ReactNode, locale: 'ko' | 'en' = 'ko') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages as never}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('CheerControls', () => {
  const mockOnSettingsChange = vi.fn();
  const mockOnEnterFullscreen = vi.fn();
  const mockOnToggleWakeLock = vi.fn().mockResolvedValue(undefined);

  function props(
    overrides: {
      settings?: CheerSettings;
      isWakeLockSupported?: boolean;
      isWakeLocked?: boolean;
    } = {}
  ) {
    return {
      settings: overrides.settings ?? DEFAULT_SETTINGS,
      onSettingsChange: mockOnSettingsChange,
      isWakeLockSupported: overrides.isWakeLockSupported ?? true,
      isWakeLocked: overrides.isWakeLocked ?? false,
      onEnterFullscreen: mockOnEnterFullscreen,
      onToggleWakeLock: mockOnToggleWakeLock,
    };
  }

  beforeEach(() => {
    mockOnSettingsChange.mockClear();
    mockOnEnterFullscreen.mockClear();
    mockOnToggleWakeLock.mockClear();
  });

  it('renders effect selector (ko)', () => {
    renderWithIntl(<CheerControls {...props()} />);

    expect(screen.getByText(/효과/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정적/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /스크롤/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /점멸/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /네온/ })).toBeInTheDocument();
  });

  it('calls onSettingsChange when effect is clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerControls {...props()} />);

    const flashButton = screen.getByRole('button', { name: /점멸/ });
    await user.click(flashButton);

    expect(mockOnSettingsChange).toHaveBeenCalledWith({ effect: 'flash' });
  });

  it('shows speed selector when effect is scroll', () => {
    renderWithIntl(
      <CheerControls {...props({ settings: { ...DEFAULT_SETTINGS, effect: 'scroll' } })} />
    );

    expect(screen.getByText(/속도/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /느림/ })).toBeInTheDocument();
  });

  it('hides speed selector when effect is static', () => {
    renderWithIntl(
      <CheerControls {...props({ settings: { ...DEFAULT_SETTINGS, effect: 'static' } })} />
    );

    const speedButtons = screen.queryAllByRole('button', { name: /느림|보통|빠름/ });
    const speedOnlyButtons = speedButtons.filter(
      (btn) => btn.textContent === '느림' || btn.textContent === '보통' || btn.textContent === '빠름'
    );
    expect(speedOnlyButtons.length).toBeLessThan(3);
  });

  it('renders color swatches', () => {
    const { container } = renderWithIntl(<CheerControls {...props()} />);

    expect(screen.getByText(/글자색/)).toBeInTheDocument();
    expect(screen.getByText(/배경색/)).toBeInTheDocument();

    const colorButtons = container.querySelectorAll('button[style*="background-color"]');
    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it('shows low contrast warning', () => {
    renderWithIntl(
      <CheerControls
        {...props({ settings: { ...DEFAULT_SETTINGS, textColor: 'white', bgColor: 'white' } })}
      />
    );

    expect(screen.getByText(/대비가 낮아요/)).toBeInTheDocument();
  });

  it('renders size selector', () => {
    renderWithIntl(<CheerControls {...props()} />);

    expect(screen.getByText(/크기/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L' })).toBeInTheDocument();
  });

  describe('size mode (manual vs auto) + device type', () => {
    it('defaults to manual mode: shows S/M/L/XL buttons, hides device type', () => {
      renderWithIntl(<CheerControls {...props()} />);

      expect(screen.getByRole('button', { name: '수동' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '자동' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '모바일' })).toBeNull();
      expect(screen.queryByRole('button', { name: '태블릿' })).toBeNull();
    });

    it('calls onSettingsChange when switching to auto mode', async () => {
      const user = userEvent.setup();
      renderWithIntl(<CheerControls {...props()} />);

      await user.click(screen.getByRole('button', { name: '자동' }));

      expect(mockOnSettingsChange).toHaveBeenCalledWith({ sizeMode: 'auto' });
    });

    it('in auto mode: hides manual S/M/L/XL buttons and shows device type buttons', () => {
      renderWithIntl(
        <CheerControls {...props({ settings: { ...DEFAULT_SETTINGS, sizeMode: 'auto' } })} />
      );

      expect(screen.queryByRole('button', { name: 'S' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'XL' })).toBeNull();
      expect(screen.getByRole('button', { name: '모바일' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '태블릿' })).toBeInTheDocument();
    });

    it('marks the current deviceType as pressed and calls onSettingsChange on selection', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <CheerControls
          {...props({ settings: { ...DEFAULT_SETTINGS, sizeMode: 'auto', deviceType: 'mobile' } })}
        />
      );

      expect(screen.getByRole('button', { name: '모바일' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '태블릿' })).toHaveAttribute('aria-pressed', 'false');

      await user.click(screen.getByRole('button', { name: '태블릿' }));
      expect(mockOnSettingsChange).toHaveBeenCalledWith({ deviceType: 'tablet' });
    });

    it('shows a hint with the auto-computed size that reflects text length', () => {
      renderWithIntl(
        <CheerControls
          {...props({
            settings: {
              ...DEFAULT_SETTINGS,
              sizeMode: 'auto',
              deviceType: 'mobile',
              text: 'go go go!!', // 10 chars → XL on mobile
            },
          })}
        />
      );

      expect(screen.getByText(/XL/)).toBeInTheDocument();
    });
  });

  it('does NOT render a manual landscape/orientation toggle', () => {
    renderWithIntl(<CheerControls {...props()} />);

    // Orientation is automatic now — no manual rotate toggle.
    expect(screen.queryByRole('button', { name: /가로 회전|가로|landscape/i })).toBeNull();
  });

  it('always shows the fullscreen button and calls onEnterFullscreen on click', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerControls {...props()} />);

    const fullscreenButton = screen.getByRole('button', { name: /전체화면/ });
    expect(fullscreenButton).toBeInTheDocument();

    await user.click(fullscreenButton);
    expect(mockOnEnterFullscreen).toHaveBeenCalledTimes(1);
  });

  it('hides keep-awake button when unsupported', () => {
    renderWithIntl(<CheerControls {...props({ isWakeLockSupported: false })} />);

    expect(screen.queryByRole('button', { name: /화면 켜짐 유지/ })).not.toBeInTheDocument();
  });

  it('shows keep-awake button when supported', () => {
    renderWithIntl(<CheerControls {...props()} />);

    const awakeButton = screen.getByRole('button', { name: /화면 켜짐 유지/ });
    expect(awakeButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows keep-awake as active when locked', () => {
    renderWithIntl(<CheerControls {...props({ isWakeLocked: true })} />);

    const awakeButton = screen.getByRole('button', { name: /화면 켜짐 유지/ });
    expect(awakeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('has accessible focus-visible styles', () => {
    const { container } = renderWithIntl(<CheerControls {...props()} />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.className).toMatch(/focus-visible:ring-focus-ring/);
    });
  });
});
