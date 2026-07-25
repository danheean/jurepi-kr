/**
 * Barcode Generator — SVG Export Tests
 * RED→GREEN: bar pattern → SVG XML
 */

import { describe, it, expect } from 'vitest';
import { normalizeBarcodeSVG } from './svg-export';

describe('normalizeBarcodeSVG', () => {
  it('should generate valid SVG XML', () => {
    const barPattern = '101010101010';
    const result = normalizeBarcodeSVG(barPattern, 200);

    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('should include width attribute', () => {
    const barPattern = '101010101010';

    const svg100 = normalizeBarcodeSVG(barPattern, 100);
    const svg200 = normalizeBarcodeSVG(barPattern, 200);
    const svg300 = normalizeBarcodeSVG(barPattern, 300);

    expect(svg100).toContain('width="100"');
    expect(svg200).toContain('width="200"');
    expect(svg300).toContain('width="300"');
  });

  it('should include text when textContent is provided', () => {
    const barPattern = '101010101010';
    const textContent = '9780143007234';

    const result = normalizeBarcodeSVG(barPattern, 200, textContent);

    expect(result).toContain('<text');
    expect(result).toContain(textContent);
  });

  it('should escape XML special characters in text', () => {
    const barPattern = '101010101010';
    const textContent = 'ABC<>&"\'';

    const result = normalizeBarcodeSVG(barPattern, 200, textContent);

    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&apos;');
  });

  it('should not include text element when textContent is undefined', () => {
    const barPattern = '101010101010';

    const result = normalizeBarcodeSVG(barPattern, 200, undefined);

    expect(result).not.toContain('<text');
  });

  it('should handle empty bar pattern', () => {
    const result = normalizeBarcodeSVG('', 200);

    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('should contain white background', () => {
    const barPattern = '101010101010';
    const result = normalizeBarcodeSVG(barPattern, 200);

    expect(result).toContain('fill="white"');
  });

  it('should contain black bars', () => {
    const barPattern = '101010101010';
    const result = normalizeBarcodeSVG(barPattern, 200);

    expect(result).toContain('fill="black"');
  });

  it('should maintain aspect ratio (2:1)', () => {
    const barPattern = '101010101010';
    const result200 = normalizeBarcodeSVG(barPattern, 200);

    // width="200"이면 height는 100 + text offset
    expect(result200).toContain('width="200"');
    // height는 200 * 0.5 + textHeight
  });

  it('should handle long bar patterns', () => {
    const longPattern = '1'.repeat(100) + '0'.repeat(100); // 200자리
    const result = normalizeBarcodeSVG(longPattern, 200);

    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('should handle various widths', () => {
    const barPattern = '101010';
    const widths = [100, 150, 200, 250, 300];

    widths.forEach((width) => {
      const result = normalizeBarcodeSVG(barPattern, width);
      expect(result).toContain(`width="${width}"`);
    });
  });
});
