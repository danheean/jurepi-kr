/// <reference types="vitest/globals" />

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LunarConverterHowTo } from './LunarConverterHowTo';
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

describe('LunarConverterHowTo', () => {
  it('renders heading with correct text', () => {
    const { getByRole } = customRender(<LunarConverterHowTo />);

    const heading = getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('음력·양력 변환기 사용 방법');
  });

  it('renders all three section headings', () => {
    const { getByText } = customRender(<LunarConverterHowTo />);

    expect(getByText('음력과 양력은 뭐가 다를까?')).toBeInTheDocument();
    expect(getByText('60갑자(간지)와 12띠란?')).toBeInTheDocument();
    expect(getByText('사용 방법')).toBeInTheDocument();
  });

  it('renders section bodies', () => {
    const { getByText } = customRender(<LunarConverterHowTo />);

    expect(getByText(/음력\(陰曆\)은 달의 위상/)).toBeInTheDocument();
    expect(getByText(/60갑자\(干支\)는 천간/)).toBeInTheDocument();
    expect(getByText(/양력 탭에서 연·월·일을/)).toBeInTheDocument();
  });

  it('renders in a section with aria-labelledby', () => {
    const { container } = customRender(<LunarConverterHowTo />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'lunar-converter-howto-heading');
  });

  it('renders three h3 headings (one per section)', () => {
    const { getAllByRole } = customRender(<LunarConverterHowTo />);

    const h3Elements = getAllByRole('heading', { level: 3 });
    expect(h3Elements).toHaveLength(3);
  });
});
