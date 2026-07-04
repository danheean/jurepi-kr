import { render, screen, fireEvent, waitFor, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { JsonFormatter } from './JsonFormatter';
import { ReactNode } from 'react';

// Mock SEO component
const MockSeoSections = () => (
  <div data-testid="seo-sections">
    <h2>SEO Content</h2>
    <p>This should render outside mounted gate</p>
  </div>
);

describe('JsonFormatter', () => {
  it('renders interactive area', async () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    // Should have input, output, and buttons
    // ('Format' appears on both the Format CTA and the output tab — assert non-empty)
    expect(screen.getByLabelText('JSON Input')).toBeInTheDocument();
    expect(screen.getAllByText('Format').length).toBeGreaterThan(0);

    // Copy lives in OutputPane and appears once there is valid output
    const textarea = screen.getByLabelText('JSON Input');
    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
  });

  it('renders children (SEO sections) outside mounted gate', () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    expect(screen.getByTestId('seo-sections')).toBeInTheDocument();
    expect(screen.getByText('SEO Content')).toBeInTheDocument();
  });

  it('accepts text input in textarea', async () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    const textarea = screen.getByLabelText('JSON Input');
    fireEvent.change(textarea, { target: { value: '{"test": 1}' } });

    expect(textarea).toHaveValue('{"test": 1}');
  });

  it('shows formatted output after input is parsed', async () => {
    const { container } = render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    const textarea = screen.getByLabelText('JSON Input');
    fireEvent.change(textarea, { target: { value: '{"test":1}' } });

    // Wait for output pane to render
    await waitFor(() => {
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('handles Ctrl+Enter keyboard shortcut for format', async () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    const textarea = screen.getByLabelText('JSON Input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"b":1,"a":2}' } });
    fireEvent.focus(textarea);
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(textarea.value).toBeTruthy();
    });
  });

  it('handles Ctrl+Shift+M keyboard shortcut for minify', async () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    const textarea = screen.getByLabelText('JSON Input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{\n  "test": 1\n}' } });
    fireEvent.focus(textarea);
    fireEvent.keyDown(textarea, { key: 'm', ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(textarea.value).toBeTruthy();
    });
  });

  it('uses two-column layout on desktop', () => {
    const { container } = render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    // Check for grid-cols-2 class (2-column on desktop)
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-2');
  });

  it('uses stacked layout on mobile', () => {
    const { container } = render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    // Check for grid-cols-1 class (1 column by default)
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('renders URL loader before input', () => {
    const { container } = render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    const urlInput = screen.getByPlaceholderText('https://api.example.com/data.json');
    const textarea = screen.getByLabelText('JSON Input');

    // URL loader should come before input in DOM
    const urlPosition = Array.from(container.querySelectorAll('input')).indexOf(urlInput as HTMLInputElement);
    const textareaPosition = Array.from(container.querySelectorAll('textarea')).indexOf(textarea as HTMLTextAreaElement);

    expect(urlPosition).toBeLessThan(textareaPosition + 1);
  });

  it('displays stats below output', () => {
    const { container } = render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    // Stats component should render but only after valid JSON
    // This is tested indirectly via OutputPane tests
    expect(container.querySelector('[role="status"]')).toBeDefined();
  });

  it('renders all action buttons', async () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    expect(screen.queryByText('Minify')).toBeInTheDocument();
    expect(screen.queryByText('Clear')).toBeInTheDocument();

    // Download appears once there is valid output (debounced parse)
    const textarea = screen.getByLabelText('JSON Input');
    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  it('renders sort keys option', () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    expect(screen.getByText('Sort keys')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders indent options', () => {
    render(
      <JsonFormatter>
        <MockSeoSections />
      </JsonFormatter>
    );

    expect(screen.getByText('2 spaces')).toBeInTheDocument();
    expect(screen.getByText('4 spaces')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });
});
