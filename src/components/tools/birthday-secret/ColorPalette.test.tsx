import { describe, it, expect } from 'vitest';
import { render } from '@/__test__/test-utils';
import { ColorPalette } from './ColorPalette';

describe('ColorPalette', () => {
  it('renders one swatch per hex value', () => {
    const { container } = render(<ColorPalette hexes={['#ff0000', '#00ff00', '#0000ff']} />);
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(3);
  });

  it('applies each hex as the swatch background via inline style (data-driven, not a token)', () => {
    const { container } = render(<ColorPalette hexes={['#d1a24e']} />);
    const swatch = container.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(swatch.style.background).toBe('rgb(209, 162, 78)');
  });

  it('hides swatches from assistive tech (decorative, color already described in text elsewhere)', () => {
    const { container } = render(<ColorPalette hexes={['#123456']} />);
    const swatch = container.querySelector('span');
    expect(swatch).toHaveAttribute('aria-hidden', 'true');
  });

  it('defaults to the medium size class', () => {
    const { container } = render(<ColorPalette hexes={['#123456']} />);
    const swatch = container.querySelector('span');
    expect(swatch?.className).toMatch(/h-11 w-11/);
  });

  it('uses the small size class when size="sm"', () => {
    const { container } = render(<ColorPalette hexes={['#123456']} size="sm" />);
    const swatch = container.querySelector('span');
    expect(swatch?.className).toMatch(/h-8 w-8/);
  });

  it('renders nothing for an empty hexes array', () => {
    const { container } = render(<ColorPalette hexes={[]} />);
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });
});
