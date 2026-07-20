import { render } from '@testing-library/react';
import { LottoGeneratorStructuredData } from './LottoGeneratorStructuredData';

// Mock useLocale
vi.mock('next-intl', () => ({
  useLocale: vi.fn(),
}));

import { useLocale } from 'next-intl';

describe('LottoGeneratorStructuredData', () => {
  it('renders SoftwareApplication JSON-LD for ko locale', () => {
    vi.mocked(useLocale).mockReturnValue('ko');

    const { container } = render(<LottoGeneratorStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toBeTruthy();

    const schema = JSON.parse(script!.innerHTML);
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe('로또 번호 생성기');
    expect(schema.url).toContain('/ko/tools/lotto-generator');
  });

  it('renders SoftwareApplication JSON-LD for en locale', () => {
    vi.mocked(useLocale).mockReturnValue('en');

    const { container } = render(<LottoGeneratorStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeInTheDocument();

    const schema = JSON.parse(script!.innerHTML);
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe('Lotto Number Generator');
    expect(schema.url).toContain('/en/tools/lotto-generator');
  });

  it('includes required SoftwareApplication fields', () => {
    vi.mocked(useLocale).mockReturnValue('ko');

    const { container } = render(<LottoGeneratorStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script!.innerHTML);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema.applicationCategory).toBe('UtilityApplication');
    expect(schema.offers).toBeDefined();
    expect(schema.offers.price).toBe('0');
    expect(schema.offers.priceCurrency).toBe('USD');
  });
});
