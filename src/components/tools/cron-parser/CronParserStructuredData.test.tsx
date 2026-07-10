import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { CronParserStructuredData } from './CronParserStructuredData';

// locale="ko" so useLocale()==='ko' and the SoftwareApplication name/url are
// the Korean shipping values (real catalog, no mock).
function renderStructuredData() {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages as never}>
      <CronParserStructuredData />
    </NextIntlClientProvider>
  );
}

describe('CronParserStructuredData', () => {
  it('renders SoftwareApplication JSON-LD script', () => {
    const { container } = renderStructuredData();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();

    const json = JSON.parse(script!.textContent || '{}');
    expect(json['@type']).toBe('SoftwareApplication');
    expect(json.name).toBe('크론 표현식 해석기');
    expect(json.applicationCategory).toBe('DeveloperApplication');
  });

  it('includes correct canonical URL', () => {
    const { container } = renderStructuredData();
    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script!.textContent || '{}');
    expect(json.url).toMatch(/\/ko\/tools\/cron-parser$/);
  });

  it('includes free offer', () => {
    const { container } = renderStructuredData();
    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script!.textContent || '{}');
    expect(json.offers.price).toBe('0');
  });
});
