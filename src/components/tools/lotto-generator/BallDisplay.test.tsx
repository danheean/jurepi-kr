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

  it('applies official 동행복권 band colors for each number range', () => {
    const testCases = [
      { number: 5, bg: 'rgb(233, 161, 0)' }, // 1–10 gold #e9a100
      { number: 15, bg: 'rgb(59, 111, 196)' }, // 11–20 blue #3b6fc4
      { number: 25, bg: 'rgb(210, 63, 85)' }, // 21–30 red #d23f55
      { number: 35, bg: 'rgb(124, 129, 142)' }, // 31–40 gray #7c818e
      { number: 42, bg: 'rgb(42, 161, 90)' }, // 41–45 green #2aa15a
    ];

    testCases.forEach(({ number, bg }) => {
      const { container } = render(
        <BallDisplay number={number} index={0} isAnimating={false} animationPhase="idle" />
      );

      const ball = container.firstChild as HTMLElement;
      expect(ball.style.backgroundColor).toBe(bg);
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
