import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { CharadesStructuredData } from './CharadesStructuredData';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderStructuredData(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CharadesStructuredData />
    </NextIntlClientProvider>
  );
}

describe('CharadesStructuredData', () => {
  it('injects exactly one valid SoftwareApplication JSON-LD script (no FAQPage duplicate)', () => {
    const { container } = renderStructuredData('ko');
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const schema = JSON.parse(scripts[0].textContent!);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toContain('몸으로 말해요');
    expect(schema.applicationCategory).toBe('UtilityApplication');
    expect(schema.offers.price).toBe('0');
  });

  it('url matches the canonical /:locale/tools/charades structure', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script!.textContent!);
    expect(schema.url).toMatch(/\/ko\/tools\/charades$/);
  });

  it('renders English version with correct locale in url', () => {
    const { container } = renderStructuredData('en', messagesEn);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script!.textContent!);
    expect(schema.url).toMatch(/\/en\/tools\/charades$/);
    expect(schema.name).toContain('Charades');
  });
});
