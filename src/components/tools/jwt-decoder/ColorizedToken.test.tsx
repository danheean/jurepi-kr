import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { ColorizedToken } from './ColorizedToken';

describe('ColorizedToken', () => {
  it('renders nothing when error is true', () => {
    const { container } = render(<ColorizedToken error />);
    expect(container.firstChild).toBeNull();
  });

  it('renders three colored parts', () => {
    render(
      <ColorizedToken
        header="eyJhbGciOiJIUzI1NiJ9"
        payload="eyJzdWIiOiIxMjM0In0"
        signature="abc123"
      />
    );

    expect(screen.getByText(/eyJhbGciOiJIUzI1NiJ9/)).toBeInTheDocument();
  });

  it('truncates long parts', () => {
    const longString = 'a'.repeat(50);
    const { container } = render(
      <ColorizedToken
        header={longString}
        payload={longString}
        signature={longString}
      />
    );

    const spans = container.querySelectorAll('span[title]');
    expect(spans.length).toBeGreaterThan(0);
    spans.forEach((span) => {
      expect(span).toHaveAttribute('title');
    });
  });

  it('displays color classes for each part', () => {
    const { container } = render(
      <ColorizedToken
        header="header"
        payload="payload"
        signature="sig"
      />
    );

    const sunInkSpan = container.querySelector('.text-accent-sun-ink');
    const mintInkSpan = container.querySelector('.text-accent-mint-ink');
    const skyInkSpan = container.querySelector('.text-accent-sky-ink');

    expect(sunInkSpan).toBeInTheDocument();
    expect(mintInkSpan).toBeInTheDocument();
    expect(skyInkSpan).toBeInTheDocument();
  });

  it('displays tab labels', () => {
    render(
      <ColorizedToken
        header="h"
        payload="p"
        signature="s"
      />
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Payload')).toBeInTheDocument();
    expect(screen.getByText('Signature')).toBeInTheDocument();
  });

  it('renders with empty values', () => {
    const { container } = render(<ColorizedToken />);
    expect(container.querySelector('.font-mono')).toBeInTheDocument();
  });
});
