import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SyntaxHighlight } from './SyntaxHighlight';

describe('SyntaxHighlight', () => {
  it('renders JSON code', () => {
    const { container } = render(
      <SyntaxHighlight json='{"test": 1}' />
    );

    expect(container.querySelector('code')).toBeInTheDocument();
  });

  // Values use the text-legible `-ink` accent tokens (≥4.5:1 on white), not the
  // raw `--accent-*` fills which fail WCAG AA as text.
  it('highlights string tokens with the legible sky-ink color', () => {
    const { container } = render(
      <SyntaxHighlight json='{"name": "John"}' />
    );

    const stringSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '"John"' && el.className.includes('text-accent-sky-ink')
    );

    expect(stringSpan).toBeInTheDocument();
  });

  it('highlights number tokens with the legible sun-ink color', () => {
    const { container } = render(
      <SyntaxHighlight json='{"age": 30}' />
    );

    const numberSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '30' && el.className.includes('text-accent-sun-ink')
    );

    expect(numberSpan).toBeInTheDocument();
  });

  it('highlights boolean tokens with the legible rose-ink color', () => {
    const { container } = render(
      <SyntaxHighlight json='{"active": true}' />
    );

    const boolSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'true' && el.className.includes('text-accent-rose-ink')
    );

    expect(boolSpan).toBeInTheDocument();
  });

  it('highlights null tokens with the legible mint-ink color', () => {
    const { container } = render(
      <SyntaxHighlight json='{"value": null}' />
    );

    const nullSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'null' && el.className.includes('text-accent-mint-ink')
    );

    expect(nullSpan).toBeInTheDocument();
  });

  it('renders keys in bold near-black so they stay distinct from value colors', () => {
    const { container } = render(
      <SyntaxHighlight json='{"key": "value"}' />
    );

    const keySpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '"key"' && el.className.includes('font-semibold')
    );

    expect(keySpan).toBeInTheDocument();
  });

  it('handles nested objects', () => {
    const { container } = render(
      <SyntaxHighlight json='{"outer": {"inner": 42}}' />
    );

    // Both strings and numbers should be highlighted
    const stringSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent?.includes('outer')
    );
    const numberSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '42'
    );

    expect(stringSpan).toBeInTheDocument();
    expect(numberSpan).toBeInTheDocument();
  });

  it('handles arrays', () => {
    const { container } = render(
      <SyntaxHighlight json='[1, "two", true]' />
    );

    const numberSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '1'
    );
    const stringSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === '"two"'
    );

    expect(numberSpan).toBeInTheDocument();
    expect(stringSpan).toBeInTheDocument();
  });

  it('preserves whitespace', () => {
    const json = '{\n  "key": "value"\n}';
    const { container } = render(<SyntaxHighlight json={json} />);

    // Whitespace span should have whitespace-pre class
    const whitespaceSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.className.includes('whitespace-pre')
    );

    expect(whitespaceSpan).toBeInTheDocument();
  });

  it('handles escaped strings', () => {
    const json = '{"text": "hello\\"world"}';
    const { container } = render(<SyntaxHighlight json={json} />);

    // Should render without throwing
    expect(container.querySelector('code')).toBeInTheDocument();
  });
});
