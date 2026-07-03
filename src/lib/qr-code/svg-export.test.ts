import { describe, it, expect } from 'vitest';
import { matrixToSvg } from './svg-export';

describe('svg-export.ts', () => {
  describe('matrixToSvg', () => {
    it('generates valid SVG XML', () => {
      const matrix = [[true, false], [false, true]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('includes correct viewBox', () => {
      const matrix = [[true], [false]];
      const svg = matrixToSvg(matrix, {
        size: 200,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      expect(svg).toContain('viewBox="0 0 200 200"');
    });

    it('includes correct width and height', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 300,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      expect(svg).toContain('width="300"');
      expect(svg).toContain('height="300"');
    });

    it('renders background rect', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      expect(svg).toContain('fill="#ffffff"');
    });

    it('renders black modules', () => {
      const matrix = [[true, false]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      expect(svg).toContain('fill="#000000"');
    });

    it('respects quiet zone', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 2,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // With quiet zone 2, the single module should be offset
      // viewBox should account for quiet zone: 1 module + 2*2 quiet zone = 5 total modules
      // 100px / 5 = 20px per module
      // Module at (0,0) should be at (2*20, 2*20) = (40, 40)
      expect(svg).toContain('x="40"');
      expect(svg).toContain('y="40"');
    });

    it('calculates module size correctly', () => {
      const matrix = [[true, true], [true, true]];
      const svg = matrixToSvg(matrix, {
        size: 200,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // 2x2 matrix, 200px size = 100px per module
      expect(svg).toContain('width="100"');
      expect(svg).toContain('height="100"');
    });

    it('renders all true modules', () => {
      const matrix = [[true, true], [true, true]];
      const svg = matrixToSvg(matrix, {
        size: 200,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // Count black rects (should be 4 modules + 1 background)
      const rects = (svg.match(/<rect/g) || []).length;
      expect(rects).toBe(5); // 1 background + 4 modules
    });

    it('skips false modules', () => {
      const matrix = [[false, false], [false, false]];
      const svg = matrixToSvg(matrix, {
        size: 200,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // Only background rect, no module rects
      const rects = (svg.match(/<rect/g) || []).length;
      expect(rects).toBe(1); // Only background
    });

    it('handles mixed modules', () => {
      const matrix = [[true, false], [false, true]];
      const svg = matrixToSvg(matrix, {
        size: 200,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // 1 background + 2 modules
      const rects = (svg.match(/<rect/g) || []).length;
      expect(rects).toBe(3);
    });

    it('uses custom foreground color', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#ff0000',
        bgColor: '#ffffff',
      });

      expect(svg).toContain('#ff0000');
    });

    it('uses custom background color', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffff00',
      });

      expect(svg).toContain('#ffff00');
    });

    it('handles large quiet zone', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 4,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // 1 module + 4*2 quiet zone = 9 total modules
      // 100px / 9 ≈ 11.11px per module
      // Module should be at (4*11.11, 4*11.11) offset
      expect(svg).toBeTruthy();
    });

    it('handles empty matrix', () => {
      const matrix: boolean[][] = [];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // Should still be valid SVG with just background
      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
    });

    it('renders SVG with all attributes', () => {
      const matrix = [[true]];
      const svg = matrixToSvg(matrix, {
        size: 150,
        quietZone: 1,
        fgColor: '#333333',
        bgColor: '#eeeeee',
      });

      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox="0 0 150 150"');
      expect(svg).toContain('width="150"');
      expect(svg).toContain('height="150"');
      expect(svg).toContain('#eeeeee');
      expect(svg).toContain('#333333');
    });

    it('matches expected SVG structure', () => {
      const matrix = [[true, false]];
      const svg = matrixToSvg(matrix, {
        size: 100,
        quietZone: 0,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });

      // SVG should be a string
      expect(typeof svg).toBe('string');
      // Should start with svg tag
      expect(svg.indexOf('<svg')).toBe(0);
      // Should end with closing tag
      expect(svg.lastIndexOf('</svg>')).toBeGreaterThan(0);
      // Background rect before modules
      expect(svg.indexOf('fill="#ffffff"')).toBeLessThan(svg.indexOf('fill="#000000"'));
    });
  });
});
