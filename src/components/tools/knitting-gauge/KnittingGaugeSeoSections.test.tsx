import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { KnittingGaugeHowTo } from './KnittingGaugeHowTo';
import koMessagesRaw from '@/i18n/messages/ko.json';
import enMessagesRaw from '@/i18n/messages/en.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enMessages = enMessagesRaw as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const koMessages = koMessagesRaw as any;

const koHowTo = koMessagesRaw.tools['knitting-gauge'].howTo;
const enHowTo = enMessagesRaw.tools['knitting-gauge'].howTo;

// The tool title area (H1/eyebrow/lead) is now rendered uniformly by the shared
// <ToolIntro> at the route level; see ToolIntro.test.tsx.

describe('KnittingGaugeHowTo', () => {
  it('renders the title and all four reference sub-sections from the real ko catalog', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <KnittingGaugeHowTo />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole('heading', { level: 2, name: koHowTo.title })).toBeInTheDocument();
    for (const title of [koHowTo.whatIsTitle, koHowTo.howToTitle, koHowTo.useCasesTitle, koHowTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/자동으로 해 줍니다/)).toBeInTheDocument();
  });

  it('renders clean English paragraphs without raw markdown markers or Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeHowTo />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole('heading', { level: 3, name: enHowTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/##|\*\*/);
    expect(container.textContent).not.toMatch(/[가-힣]/);
  });
});
