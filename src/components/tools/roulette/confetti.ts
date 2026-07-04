/**
 * Confetti animation: spawn DOM elements with CSS keyframe animations.
 * Zero dependencies. Respects prefers-reduced-motion.
 */

const ACCENT_COLORS = ['coral', 'mint', 'sky', 'sun', 'grape', 'rose'];

export interface ConfettiOptions {
  count?: number;
  duration?: number; // ms
}

/**
 * Spawn confetti particles in a container element.
 * Each particle animates: scale 1→0.2, opacity 1→0, rotate, stagger.
 * Cleans up after animation completes.
 */
export function spawnConfetti(
  containerElement: HTMLElement,
  options?: ConfettiOptions
): void {
  const { count = 50, duration = 1500 } = options || {};

  // Check prefers-reduced-motion; skip particles if true
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return; // Skip animation entirely on reduced-motion
  }

  // Create style element for dynamic keyframes
  const style = document.createElement('style');
  const keyframes: string[] = [];

  // Generate confetti pieces
  const pieces = Array.from({ length: count }).map((_, i) => {
    const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
    const delay = (i * (duration / count)) % duration; // Stagger across duration
    const xOffset = (Math.random() - 0.5) * 400; // -200 to 200px
    const yOffset = -Math.random() * 200; // -200 to 0px
    const rotation = Math.random() * 720; // 0 to 720 degrees
    const size = 4 + Math.random() * 8; // 4-12px

    // Generate unique keyframe for this particle
    const keyframeName = `confetti-${i}`;
    keyframes.push(`
      @keyframes ${keyframeName} {
        0% {
          transform: translateX(${xOffset}px) translateY(${yOffset}px) rotate(0deg) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateX(${xOffset * 0.3}px) translateY(${yOffset + 300}px) rotate(${rotation}deg) scale(0.2);
          opacity: 0;
        }
      }
    `);

    return {
      id: i,
      keyframeName,
      color,
      delay,
      duration,
      size,
    };
  });

  style.textContent = keyframes.join('');
  document.head.appendChild(style);

  // Create and append particle elements
  const particles: HTMLElement[] = [];
  pieces.forEach((piece) => {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      width: ${piece.size}px;
      height: ${piece.size}px;
      background-color: var(--accent-${piece.color});
      border-radius: 2px;
      pointer-events: none;
      animation: ${piece.keyframeName} ${piece.duration}ms ease-out forwards;
      animation-delay: ${piece.delay}ms;
    `;

    containerElement.appendChild(particle);
    particles.push(particle);
  });

  // Cleanup after animation completes
  setTimeout(() => {
    particles.forEach((particle) => {
      particle.remove();
    });
    style.remove();
  }, duration + Math.max(...pieces.map((p) => p.delay)));
}
