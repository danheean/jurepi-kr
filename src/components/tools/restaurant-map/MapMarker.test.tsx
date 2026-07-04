import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MapMarker } from './MapMarker';

describe('MapMarker', () => {
  it('renders null (placeholder component)', () => {
    const { container } = render(
      <MapMarker lat={37.5} lng={126.97} title="Test Marker" />
    );

    // MapMarker returns null, so container should be empty
    expect(container.firstChild).toBeNull();
  });

  it('accepts all required props without error', () => {
    const onClickMock = vi.fn();
    const { container } = render(
      <MapMarker
        lat={37.5}
        lng={126.97}
        title="Test Marker"
        onClick={onClickMock}
      />
    );

    // Should render without error
    expect(container).toBeDefined();
  });

  it('accepts optional onClick prop', () => {
    const onClickMock = vi.fn();
    const { container } = render(
      <MapMarker
        lat={37.5}
        lng={126.97}
        title="Test Marker"
        onClick={onClickMock}
      />
    );

    expect(container).toBeDefined();
  });

  it('can be rendered multiple times without issues', () => {
    const { container: container1 } = render(
      <MapMarker lat={37.5} lng={126.97} title="Marker 1" />
    );
    const { container: container2 } = render(
      <MapMarker lat={37.6} lng={127.0} title="Marker 2" />
    );

    expect(container1.firstChild).toBeNull();
    expect(container2.firstChild).toBeNull();
  });

  it('handles extreme latitude and longitude values', () => {
    const { container } = render(
      <MapMarker lat={90} lng={180} title="Extreme Marker" />
    );

    expect(container).toBeDefined();
  });

  it('handles negative latitude and longitude', () => {
    const { container } = render(
      <MapMarker lat={-33.8688} lng={151.2093} title="Southern Marker" />
    );

    expect(container).toBeDefined();
  });
});
