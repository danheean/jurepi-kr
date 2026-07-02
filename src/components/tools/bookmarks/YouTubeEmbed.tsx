'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play } from 'lucide-react';
import { youtubeThumbUrl, youtubeEmbedUrl } from '@/lib/bookmarks/youtube';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface YouTubeEmbedProps {
  youtubeId: string;
  label: string;
  description?: string;
}

export function YouTubeEmbed({ youtubeId, label, description }: YouTubeEmbedProps) {
  const t = useTranslations('tools.bookmarks.link');
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const thumbUrl = youtubeThumbUrl(youtubeId);
  const embedUrl = youtubeEmbedUrl(youtubeId);

  return (
    <div
      className="block rounded-lg border border-hairline hover:border-accent-sky transition-colors focus-within:ring-2 focus-within:ring-focus-ring focus-within:ring-offset-0"
      role="region"
      aria-label={`${label} (${t('playVideo')})`}
    >
      {/* 16:9 container with reserved space to prevent CLS */}
      <div className="relative w-full bg-surface-muted overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
        {!isLoaded ? (
          <>
            {/* Thumbnail fade-in (unless reduced motion) */}
            {!thumbError && (
              <img
                src={thumbUrl}
                alt=""
                width={1280}
                height={720}
                className={`absolute inset-0 w-full h-full object-cover ${
                  prefersReducedMotion ? 'opacity-100' : 'animate-fade-in'
                }`}
                loading="lazy"
                onError={() => setThumbError(true)}
              />
            )}

            {/* Scrim + Play button overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/20 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsLoaded(true)}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-sky hover:bg-accent-sky/90 shadow-card hover:shadow-card-hover transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-surface-muted"
                aria-label={t('playVideo')}
              >
                <Play className="w-7 h-7 text-white fill-white" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          /* Embed iframe filling the 16:9 box */
          <iframe
            src={embedUrl}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full border-none"
          />
        )}
      </div>

      {/* Label + description row below embed */}
      <div className="p-3">
        <div className="font-semibold text-base text-text">{label}</div>
        {description && (
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );
}
