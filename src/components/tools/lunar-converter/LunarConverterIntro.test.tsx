/// <reference types="vitest/globals" />

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LunarConverterIntro } from './LunarConverterIntro';
import messagesKo from '@/i18n/messages/ko.json';

function RenderWithIntl({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="ko" messages={messagesKo as any}>
      {children}
    </NextIntlClientProvider>
  );
}

const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: RenderWithIntl, ...options });

describe('LunarConverterIntro', () => {
  it('renders eyebrow, title, and lead text', () => {
    const { getByText } = customRender(<LunarConverterIntro />);

    expect(getByText('변환 도구')).toBeInTheDocument();
    expect(getByText('음력·양력 변환기')).toBeInTheDocument();
    expect(
      getByText(
        /양력\(서력\)과 음력의 날짜를 서로 변환하고, 60갑자\(간지\)/
      )
    ).toBeInTheDocument();
  });

  it('renders h1 element with title', () => {
    const { getByRole } = customRender(<LunarConverterIntro />);

    const heading = getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('음력·양력 변환기');
  });

  it('renders in a header element', () => {
    const { container } = customRender(<LunarConverterIntro />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });
});
