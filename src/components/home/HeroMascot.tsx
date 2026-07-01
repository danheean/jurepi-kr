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
  // Optional external destination for the mascot (e.g. owner's blog).
  // When unset/empty, the mascot stays a plain, non-interactive image.
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL?.trim();

  const portrait = (
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
  );

  return (
    <div className={`flex flex-col items-center gap-3 ${className || ''}`}>
      {blogUrl ? (
        <a
          href={blogUrl}
          aria-label="Jurepi 블로그"
          className="rounded-full transition-transform duration-200 ease-out hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          {portrait}
        </a>
      ) : (
        portrait
      )}
      {greeting && (
        <div className="text-center">
          <p className="text-sm text-text-secondary font-medium">{greeting}</p>
        </div>
      )}
    </div>
  );
}
