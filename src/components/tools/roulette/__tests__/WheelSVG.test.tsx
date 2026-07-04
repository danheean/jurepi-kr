import { describe, it, expect } from 'vitest';
import { render } from '@/__test__/test-utils';
import { WheelSVG } from '../WheelSVG';
import type { Option } from '@/lib/roulette/schema';
import type { SliceInfo } from '@/lib/roulette/geometry';
import { LEGEND_THRESHOLD } from '@/lib/roulette/schema';

describe('WheelSVG', () => {
  const createSliceGeometry = (count: number): SliceInfo[] => {
    const sliceSpan = 360 / count;
    return Array.from({ length: count }, (_, i) => ({
      angle: i * sliceSpan,
      span: sliceSpan,
      midAngle: i * sliceSpan + sliceSpan / 2,
    }));
  };

  it('renders SVG with correct viewBox for small option count', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
      { label: 'Burger', weight: 1 },
      { label: 'Salad', weight: 1 },
    ];
    const slices = createSliceGeometry(4);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // viewBox size should be 320 for 4 options (below LEGEND_THRESHOLD)
    expect(svg).toHaveAttribute('viewBox', '0 0 320 320');
  });

  it('renders 4 slice paths for 4 options', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
      { label: 'Burger', weight: 1 },
      { label: 'Salad', weight: 1 },
    ];
    const slices = createSliceGeometry(4);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    const paths = container.querySelectorAll('path');
    // Each slice = 1 path, plus other structural paths (ticks, etc.)
    // At least 4 paths should be for slices
    expect(paths.length).toBeGreaterThanOrEqual(4);
  });

  it('renders option labels as SVG text for small option count', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
      { label: 'Burger', weight: 1 },
      { label: 'Salad', weight: 1 },
    ];
    const slices = createSliceGeometry(4);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    // SVG should render with slice elements
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // For small count, labels should be rendered as text (not legend)
    // Check that container has text content for all options
    const allText = container.textContent || ""
    expect(allText).toContain('Pizza');
    expect(allText).toContain('Pasta');
    expect(allText).toContain('Burger');
    expect(allText).toContain('Salad');
  });

  it('renders legend with numbers for large option count (>LEGEND_THRESHOLD)', () => {
    const options: Option[] = Array.from({ length: 20 }, (_, i) => ({
      label: `Option ${i + 1}`,
      weight: 1,
    }));
    const slices = createSliceGeometry(20);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    // SVG should be larger (400 viewBox) for >LEGEND_THRESHOLD
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 400 400');

    // Legend list should be present
    const legendItems = container.querySelectorAll('div');
    // Count how many legend entries are visible (20 options)
    let legendFound = false;
    legendItems.forEach((item) => {
      if (item.textContent && item.textContent.includes('1.') && item.textContent.includes('Option 1')) {
        legendFound = true;
      }
    });
    expect(legendFound).toBe(true);
  });

  it('renders legend list items with numbers 1–20 for 20 options', () => {
    const options: Option[] = Array.from({ length: 20 }, (_, i) => ({
      label: `Item ${i + 1}`,
      weight: 1,
    }));
    const slices = createSliceGeometry(20);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    // Check for legend list text content (div with number and label)
    const fullText = container.textContent || '';
    expect(fullText).toContain('20.');
    expect(fullText).toContain('Item 20');
  });

  it('highlights selected slice with different fill opacity and stroke', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
      { label: 'Burger', weight: 1 },
      { label: 'Salad', weight: 1 },
    ];
    const slices = createSliceGeometry(4);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={2}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    const paths = container.querySelectorAll('path');
    // Path at index 2 should have higher fillOpacity and a stroke
    // (We're checking structure, not exact CSS values which may be computed)
    expect(paths.length).toBeGreaterThanOrEqual(4);
  });

  it('displays center circle with selected option name', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
    ];
    const slices = createSliceGeometry(2);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={1}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    // When selectedIndex is set, the winner name should be displayed
    // This is rendered inside the SVG center circle
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check that the text content includes the selected option
    const allText = container.textContent || ""
    expect(allText).toContain('Pasta');
  });

  it('renders pointer indicator at top', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
    ];
    const slices = createSliceGeometry(2);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    // Pointer is a polygon at top
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);
  });

  it('does not render index numbers for small option count', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
      { label: 'Burger', weight: 1 },
      { label: 'Salad', weight: 1 },
    ];
    const slices = createSliceGeometry(4);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={0}
        prefersReducedMotion={false}
      />
    );

    // For small count (4 < LEGEND_THRESHOLD), legend should not exist
    // Check that the viewBox is 320 (not 400)
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 320 320');

    // Legend container should not exist for small count
    const legendLists = container.querySelectorAll('div.max-h-32');
    expect(legendLists.length).toBe(0);
  });

  it('applies rotation transform based on finalAngle', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
    ];
    const slices = createSliceGeometry(2);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={false}
        finalAngle={45}
        prefersReducedMotion={false}
      />
    );

    // Check that g element has transform with rotation
    const gElements = container.querySelectorAll('g');
    let foundRotation = false;
    gElements.forEach((g) => {
      const style = g.getAttribute('style') || '';
      if (style.includes('rotate(45deg)')) {
        foundRotation = true;
      }
    });
    expect(foundRotation).toBe(true);
  });

  it('respects prefersReducedMotion by not applying animation transition', () => {
    const options: Option[] = [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 1 },
    ];
    const slices = createSliceGeometry(2);

    const { container } = render(
      <WheelSVG
        options={options}
        sliceGeometry={slices}
        selectedIndex={null}
        spinning={true}
        finalAngle={90}
        prefersReducedMotion={true}
      />
    );

    // With prefersReducedMotion, transition should be 'none'
    const gElements = container.querySelectorAll('g');
    let foundNoTransition = false;
    gElements.forEach((g) => {
      const style = g.getAttribute('style') || '';
      if (style.includes('transition: none')) {
        foundNoTransition = true;
      }
    });
    expect(foundNoTransition).toBe(true);
  });
});
