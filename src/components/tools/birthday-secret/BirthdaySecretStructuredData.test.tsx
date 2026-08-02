import { render } from '@/__test__/test-utils';
import { BirthdaySecretStructuredData } from './BirthdaySecretStructuredData';

describe('BirthdaySecretStructuredData', () => {
  it('emits exactly one SoftwareApplication JSON-LD (no FAQPage here — Faq owns that)', () => {
    render(<BirthdaySecretStructuredData />);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const jsonLd = JSON.parse(scripts[0].innerHTML);
    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.name).toBe('Birthday Secrets');
    expect(jsonLd.url).toBe('https://jurepi.kr/en/tools/birthday-secret');
  });
});
