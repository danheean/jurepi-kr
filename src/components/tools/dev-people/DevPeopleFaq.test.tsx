import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DevPeopleFaq } from './DevPeopleFaq';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

function renderKo() {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <DevPeopleFaq />
    </NextIntlClientProvider>
  );
}

function renderEn() {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <DevPeopleFaq />
    </NextIntlClientProvider>
  );
}

describe('DevPeopleFaq', () => {
  it('renders section with FAQ title (Ko locale)', () => {
    renderKo();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/자주 묻는 질문/);
  });

  it('renders section with aria-labelledby pointing to FAQ heading', () => {
    renderKo();

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'dev-people-faq-heading');
  });

  it('renders FAQ items as details elements', () => {
    renderKo();

    const details = screen.getAllByRole('group');
    expect(details.length).toBeGreaterThan(0);
  });

  it('renders questions as summary elements', () => {
    renderKo();

    // FAQ items should have questions (Ko locale)
    expect(
      screen.getByText(/개발 인물 사전이란/i)
    ).toBeInTheDocument();
  });

  it('renders answers inside each details element', () => {
    renderKo();

    // Check for at least one FAQ answer (Ko locale)
    expect(
      screen.getByText(/소프트웨어와 컴퓨터 과학을/i)
    ).toBeInTheDocument();
  });

  it('has data-testid on each FAQ item', () => {
    renderKo();

    const faqItem0 = screen.getByTestId('faq-item-0');
    expect(faqItem0).toBeInTheDocument();
    // details element has role="group" in terms of accessibility tree
  });

  it('renders FAQPage JSON-LD script exactly once', () => {
    const { container } = renderKo();

    const jsonLdScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(jsonLdScripts.length).toBe(1);
  });

  it('FAQPage JSON-LD contains mainEntity with questions and answers', () => {
    const { container } = renderKo();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const json = JSON.parse(script!.innerHTML);
    expect(json['@type']).toBe('FAQPage');
    expect(Array.isArray(json.mainEntity)).toBe(true);
    expect(json.mainEntity.length).toBeGreaterThan(0);

    // Each item should have question and acceptedAnswer
    json.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBeTruthy();
    });
  });

  it('renders English FAQ content for en locale', () => {
    renderEn();

    expect(
      screen.getByText(/What is Developer People Dictionary/i)
    ).toBeInTheDocument();

    // English version should also have JSON-LD
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messagesEn as never}>
        <DevPeopleFaq />
      </NextIntlClientProvider>
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('FAQ items are collapsible details elements', () => {
    renderKo();

    const details = screen.getByTestId('faq-item-0');
    expect(details.tagName.toLowerCase()).toBe('details');
  });

  it('summary inside details is focusable and clickable', () => {
    renderKo();

    const summary = screen.getByText(/개발 인물 사전이란/i);
    expect(summary).toBeInTheDocument();
    expect(summary.tagName.toLowerCase()).toBe('summary');
  });

  it('section has correct accessibility attributes', () => {
    renderKo();

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'dev-people-faq-heading');
  });
});
