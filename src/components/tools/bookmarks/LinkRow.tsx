'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { YouTubeEmbed } from './YouTubeEmbed';

interface LinkRowProps {
  label: string;
  url: string;
  description?: string;
  locale: 'ko' | 'en';
  youtubeId?: string;
  image?: string;
}

export function LinkRow({ label, url, description, locale, youtubeId, image }: LinkRowProps) {
  const t = useTranslations('tools.bookmarks.link');
  const [imageError, setImageError] = useState(false);

  // Case 1: YouTube video — click-to-load embed
  if (youtubeId) {
    return (
      <div className="flex flex-col gap-2">
        <YouTubeEmbed youtubeId={youtubeId} label={label} description={description} />
        {/* External link button to open source video */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-1 text-accent-sky hover:text-accent-sky/80 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
          aria-label={`${label} ${t('openInNewTab')}`}
        >
          <span className="text-xs uppercase tracking-wide">{t('externalLink')}</span>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    );
  }

  // Case 2: Non-video with OpenGraph image
  if (image && !imageError) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 p-3 rounded-lg border border-hairline hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
        aria-label={`${label} ${t('openInNewTab')}`}
      >
        {/* Thumbnail (reserved space to prevent CLS) */}
        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-surface-sunken">
          <img
            src={image}
            alt=""
            width={64}
            height={64}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Label + description + icon */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-base text-text break-words">{label}</div>
            {description && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
        </div>
      </a>
    );
  }

  // Case 3: Plain link (no YouTube, no image or image failed)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-hairline hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
      aria-label={`${label} ${t('openInNewTab')}`}
    >
      <div className="flex items-start gap-3 min-h-11">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-text break-words">{label}</div>
          {description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
      </div>
    </a>
  );
}
