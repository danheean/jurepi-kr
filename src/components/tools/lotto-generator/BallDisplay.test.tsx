import { render, screen } from '@testing-library/react';
import { BallDisplay } from './BallDisplay';

describe('BallDisplay', () => {
  it('renders a ball with correct number and color', () => {
    const { container } = render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" />
    ) as any;

    const ball = screen.getByRole('img', { name: /Ball 7/i });
    expect(ball).toBeInTheDocument();
    expect(ball).toHaveTextContent('7');
  });

  it('applies color classes for different number ranges', () => {
    const testCases = [
      { number: 5, expectedBg: 'bg-accent-sun' }, // 1–10
      { number: 15, expectedBg: 'bg-accent-sky' }, // 11–20
      { number: 25, expectedBg: 'bg-accent-coral' }, // 21–30
      { number: 35, expectedBg: 'bg-surface-sunken' }, // 31–40
      { number: 42, expectedBg: 'bg-accent-mint' }, // 41–45
    ];

    testCases.forEach(({ number, expectedBg }) => {
      const { container } = render(
        <BallDisplay number={number} index={0} isAnimating={false} animationPhase="idle" />
      );

      const ball = container.firstChild;
      expect(ball).toHaveClass(expectedBg);
    });
  });

  it('has correct aria-label', () => {
    render(<BallDisplay number={42} index={0} isAnimating={false} animationPhase="idle" />);

    const ball = screen.getByRole('img', { name: /Ball 42/i });
    expect(ball).toHaveAttribute('aria-label', 'Ball 42');
  });

  it('applies opacity and scale during pop animation', () => {
    const { container, rerender } = render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" />
    );

    const ball = container.firstChild as HTMLElement;

    // During locking phase, should apply animation styles
    rerender(<BallDisplay number={7} index={0} isAnimating={true} animationPhase="locking" />);

    // Check that transform and opacity styles exist (actual values depend on timing)
    const style = (ball as HTMLElement).getAttribute('style');
    expect(style).toMatch(/transform|opacity/);
  });

  it('renders with no animation in idle phase', () => {
    const { container } = render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" />
    );

    const ball = container.firstChild as HTMLElement;
    const style = ball.getAttribute('style');

    // Idle phase should have default scale and opacity
    expect(style).toMatch(/opacity.*1|scale.*1/);
  });
});
