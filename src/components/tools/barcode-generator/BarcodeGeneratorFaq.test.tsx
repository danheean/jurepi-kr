import { render, screen } from '@/__test__/test-utils';
import { BarcodeGeneratorFaq } from './BarcodeGeneratorFaq';

describe('BarcodeGeneratorFaq', () => {
  it('renders all 7 FAQ questions from the real catalog (not raw bracket-index keys)', () => {
    render(<BarcodeGeneratorFaq />);

    expect(screen.getByRole('heading', { level: 2, name: 'Frequently Asked Questions' })).toBeInTheDocument();
    expect(screen.getByText('What is a barcode?')).toBeInTheDocument();
    expect(
      screen.getByText("What's the difference between EAN-13, UPC-A, Code 39, and Code 128?")
    ).toBeInTheDocument();
    expect(screen.getByText('Do I need to calculate the checksum myself?')).toBeInTheDocument();
    expect(screen.getByText('Where is my generated barcode stored?')).toBeInTheDocument();
    expect(screen.getByText('Should I download PNG or SVG?')).toBeInTheDocument();
    expect(screen.getByText('Can I customize the barcode color?')).toBeInTheDocument();
    expect(screen.getByText('Should I choose Code 39 or Code 128?')).toBeInTheDocument();

    // Guard against the raw next-intl key leaking through if t.raw() ever regresses
    // back to bracket-index t() calls.
    expect(document.body.textContent).not.toMatch(/faq\.items\[\d+\]/);
  });

  it('emits exactly one FAQPage JSON-LD script with matching question count', () => {
    render(<BarcodeGeneratorFaq />);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const jsonLd = JSON.parse(scripts[0].innerHTML);
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd.mainEntity).toHaveLength(7);
    expect(jsonLd.mainEntity[0].name).toBe('What is a barcode?');
  });

  it('renders each FAQ item as a collapsed <details> (progressive disclosure for a long list)', () => {
    render(<BarcodeGeneratorFaq />);

    const items = screen.getAllByTestId(/faq-item-\d/);
    expect(items).toHaveLength(7);
    items.forEach((item) => {
      expect(item.tagName.toLowerCase()).toBe('details');
      expect(item).not.toHaveAttribute('open');
    });
  });
});
