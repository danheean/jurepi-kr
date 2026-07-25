import { render, screen } from '@/__test__/test-utils';
import { BarcodeGeneratorHowTo } from './BarcodeGeneratorHowTo';

describe('BarcodeGeneratorHowTo', () => {
  it('renders all four sections always-visible (no <details> collapse)', () => {
    render(<BarcodeGeneratorHowTo />);

    expect(screen.getByRole('heading', { level: 2, name: 'How to Generate a Barcode' })).toBeInTheDocument();
    expect(screen.getByText('What is this tool?')).toBeInTheDocument();
    expect(screen.getByText('When to use it')).toBeInTheDocument();
    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText(/EAN-13 \(standard retail\)/)).toBeInTheDocument();
    expect(document.querySelector('details')).toBeNull();
  });
});
