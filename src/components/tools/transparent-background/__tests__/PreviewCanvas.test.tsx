import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PreviewCanvas } from '../PreviewCanvas';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('PreviewCanvas', () => {
  it('renders preview label', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={undefined}
          isProcessing={false}
          sourceWidth={undefined}
          sourceHeight={undefined}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(messages.ko.tools['transparent-background'].preview.label)).toBeInTheDocument();
  });

  it('shows spinner when processing', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={undefined}
          isProcessing={true}
          sourceWidth={undefined}
          sourceHeight={undefined}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(messages.ko.tools['transparent-background'].preview.detecting)).toBeInTheDocument();
  });

  it('displays placeholder text when no result canvas', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={undefined}
          isProcessing={false}
          sourceWidth={undefined}
          sourceHeight={undefined}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(messages.ko.tools['transparent-background'].preview.empty)).toBeInTheDocument();
  });

  it('renders canvas element when resultCanvas is provided', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 200;
    mockCanvas.height = 150;

    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={mockCanvas}
          isProcessing={false}
          sourceWidth={200}
          sourceHeight={150}
        />
      </NextIntlClientProvider>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('gives the result canvas an accessible name (canvas pixels have no inherent text alternative)', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 200;
    mockCanvas.height = 150;

    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={mockCanvas}
          isProcessing={false}
          sourceWidth={200}
          sourceHeight={150}
        />
      </NextIntlClientProvider>
    );

    expect(
      screen.getByRole('img', { name: messages.ko.tools['transparent-background'].preview.resultAlt })
    ).toBeInTheDocument();
  });

  it('displays image dimensions when provided', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={undefined}
          isProcessing={false}
          sourceWidth={1920}
          sourceHeight={1080}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/1920×1080/)).toBeInTheDocument();
  });

  it('has max-height and max-width for responsive layout', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <PreviewCanvas
          resultCanvas={undefined}
          isProcessing={false}
          sourceWidth={undefined}
          sourceHeight={undefined}
        />
      </NextIntlClientProvider>
    );

    const preview = container.querySelector('div[style*="max-height"]');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveStyle('max-height: 400px');
    expect(preview).toHaveStyle('max-width: 100%');
  });
});
