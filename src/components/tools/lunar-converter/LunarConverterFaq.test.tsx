/// <reference types="vitest/globals" />

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LunarConverterFaq } from './LunarConverterFaq';
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

describe('LunarConverterFaq', () => {
  it('renders FAQ heading', () => {
    const { getByRole } = customRender(<LunarConverterFaq />);

    const heading = getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('자주 묻는 질문');
  });

  it('renders all FAQ items as details elements', () => {
    const { container } = customRender(<LunarConverterFaq />);

    const detailsElements = container.querySelectorAll('details');
    expect(detailsElements.length).toBeGreaterThan(0);
  });

  it('renders FAQ questions', () => {
    const { getByText } = customRender(<LunarConverterFaq />);

    expect(getByText(/음력 윤달.*뭔가요/)).toBeInTheDocument();
    expect(getByText(/설날.*추석.*찾을 수 있나요/)).toBeInTheDocument();
    expect(getByText(/범위가 정해져 있나요/)).toBeInTheDocument();
  });

  it('renders FAQ answers', () => {
    const { getByText } = customRender(<LunarConverterFaq />);

    expect(getByText(/음력은 순수 태음력이라/)).toBeInTheDocument();
    expect(getByText(/1391년부터 2050년까지/)).toBeInTheDocument();
  });

  it('injects FAQPage JSON-LD script', () => {
    const { container } = customRender(<LunarConverterFaq />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);

    // Find the FAQ schema
    let faqSchemaFound = false;
    scripts.forEach((script) => {
      if (script.textContent) {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'FAQPage') {
          faqSchemaFound = true;
          expect(json.mainEntity).toBeDefined();
          expect(Array.isArray(json.mainEntity)).toBe(true);
          expect(json.mainEntity.length).toBeGreaterThan(0);
        }
      }
    });

    expect(faqSchemaFound).toBe(true);
  });

  it('renders in a section with aria-labelledby', () => {
    const { container } = customRender(<LunarConverterFaq />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'lunar-converter-faq-heading');
  });
});
