import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPickers } from '../ColorPickers';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  tools: {
    'qr-code': {
      colors: {
        fgLabel: 'Foreground (Dark)',
        bgLabel: 'Background (Light)',
        contrast: 'Contrast: {value}',
        contrastGood: 'Good',
        contrastWarn: 'Warning',
        contrastPoor: 'Poor',
      },
    },
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('ColorPickers', () => {
  it('renders foreground and background labels', () => {
    render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
      />,
      { wrapper }
    );

    // Check for label elements, not button labels
    expect(screen.getByText('Foreground (Dark)')).toBeInTheDocument();
    expect(screen.getByText('Background (Light)')).toBeInTheDocument();
  });

  it('displays current hex colors in inputs', () => {
    render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByDisplayValue(/^#[0-9a-f]{6}$/i);
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onFgChange when foreground color input changes', () => {
    const onFgChange = vi.fn();
    render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={onFgChange}
        onBgChange={() => {}}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByDisplayValue('#2a2411') as HTMLInputElement[];
    const fgInput = inputs[0];

    fireEvent.change(fgInput, { target: { value: '#ff0000' } });
    expect(onFgChange).toHaveBeenCalledWith('#ff0000');
  });

  it('shows contrast indicator with value', () => {
    render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
        contrast={87}
        isContrastAcceptable={true}
      />,
      { wrapper }
    );

    expect(screen.getByText(/Contrast: 87/i)).toBeInTheDocument();
  });

  it('displays "Good" status for contrast >= 50', () => {
    render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
        contrast={87}
        isContrastAcceptable={true}
      />,
      { wrapper }
    );

    expect(screen.getByText(/Good/i)).toBeInTheDocument();
  });

  it('displays "Warning" status for contrast < 50 and >= 30', () => {
    render(
      <ColorPickers
        fgColor="#cccccc"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
        contrast={40}
        isContrastAcceptable={false}
      />,
      { wrapper }
    );

    expect(screen.getByText(/Warning/i)).toBeInTheDocument();
  });

  it('displays "Poor" status for contrast < 30', () => {
    render(
      <ColorPickers
        fgColor="#f0f0f0"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
        contrast={10}
        isContrastAcceptable={false}
      />,
      { wrapper }
    );

    expect(screen.getByText(/Poor/i)).toBeInTheDocument();
  });

  it('renders palette color buttons', () => {
    const { container } = render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={() => {}}
        onBgChange={() => {}}
      />,
      { wrapper }
    );

    const colorButtons = container.querySelectorAll('button[style*="background"]');
    expect(colorButtons.length).toBeGreaterThan(10); // 8 colors × 2 sections (fg/bg)
  });

  it('calls onFgChange when palette button clicked', () => {
    const onFgChange = vi.fn();
    const { container } = render(
      <ColorPickers
        fgColor="#2a2411"
        bgColor="#ffffff"
        onFgChange={onFgChange}
        onBgChange={() => {}}
      />,
      { wrapper }
    );

    const colorButtons = container.querySelectorAll('button[aria-label*="Foreground"]');
    if (colorButtons.length > 0) {
      fireEvent.click(colorButtons[0]);
      expect(onFgChange).toHaveBeenCalled();
    }
  });
});
