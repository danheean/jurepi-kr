import Image from 'next/image';

interface HeroMascotProps {
  greeting?: string;
  size?: number; // default 132
  priority?: boolean;
  className?: string;
}

/**
 * HeroMascot renders the Jurepi mascot image with optional greeting caption.
 * Server-compatible (no 'use client' needed).
 * Explicit width/height = size (CLS-safe).
 */
export function HeroMascot({
  greeting,
  size = 132,
  priority = false,
  className,
}: HeroMascotProps): React.ReactNode {
  return (
    <div className={`flex flex-col items-center gap-3 ${className || ''}`}>
      <div
        className="rounded-full overflow-hidden shadow-card"
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        <Image
          src="/mascot/jurepi-mascot-512.webp"
          alt="Jurepi 마스코트"
          width={size}
          height={size}
          priority={priority}
          quality={85}
          className="w-full h-full object-cover"
        />
      </div>
      {greeting && (
        <div className="text-center">
          <p className="text-sm text-text-secondary font-medium">{greeting}</p>
        </div>
      )}
    </div>
  );
}
