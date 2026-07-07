import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { PresetLibrary } from './PresetLibrary';
import type { Preset } from '@/lib/find-replace';

describe('PresetLibrary', () => {
  const mockPresets: Preset[] = [
    {
      id: 'to-js-string',
      labelKey: 'preset.toJsString',
      kind: 'builtin',
      transform: 'to-js-string',
    },
    {
      id: 'normalize-quotes',
      labelKey: 'preset.normalizeQuotes',
      kind: 'builtin',
      transform: 'normalize-quotes',
    },
  ];

  it('renders preset buttons for each preset', () => {
    const onSelect = vi.fn();
    render(<PresetLibrary presets={mockPresets} onSelectPreset={onSelect} />);

    expect(screen.getByTestId('preset-to-js-string')).toBeInTheDocument();
    expect(screen.getByTestId('preset-normalize-quotes')).toBeInTheDocument();
  });

  it('calls onSelectPreset when a preset button is clicked', () => {
    const onSelect = vi.fn();
    render(<PresetLibrary presets={mockPresets} onSelectPreset={onSelect} />);

    screen.getByTestId('preset-to-js-string').click();
    expect(onSelect).toHaveBeenCalledWith(mockPresets[0]);
  });

  it('renders preset titles from i18n keys', () => {
    const onSelect = vi.fn();
    render(<PresetLibrary presets={mockPresets} onSelectPreset={onSelect} />, {
      locale: 'en',
    });

    // In en locale, these should show English labels
    expect(screen.getByText(/Multi-line/)).toBeInTheDocument();
  });

  it('renders empty list when presets array is empty', () => {
    const onSelect = vi.fn();
    render(<PresetLibrary presets={[]} onSelectPreset={onSelect} />);

    // Should still render title but no buttons
    expect(screen.getByText('Presets')).toBeInTheDocument();
  });
});
