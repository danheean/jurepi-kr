import { render } from '@/__test__/test-utils';
import { BarcodeGeneratorStructuredData } from './BarcodeGeneratorStructuredData';

describe('BarcodeGeneratorStructuredData', () => {
  it('emits exactly one SoftwareApplication JSON-LD (no FAQPage here — Faq owns that)', () => {
    render(<BarcodeGeneratorStructuredData />);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const jsonLd = JSON.parse(scripts[0].innerHTML);
    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.name).toBe('Barcode Generator');
    expect(jsonLd.url).toBe('https://jurepi.kr/en/tools/barcode-generator');
  });
});
