'use client';

import React, { useState } from 'react';

interface MarkdownImageProps {
  /** Image source URL */
  src?: string;
  /** Image alt text (also used for figcaption if present) */
  alt?: string;
}

/**
 * MarkdownImage: enhanced <img> override for markdown.
 * Renders a <figure> with <img> + optional <figcaption> from alt.
 * Only allows same-origin /images/* or https:// URLs (blocks javascript:, data:, etc.).
 * Uses lazy loading and async decoding.
 */
export function MarkdownImage({ src = '', alt = '' }: MarkdownImageProps) {
  const [error, setError] = useState(false);

  // Validate URL: only allow same-origin /images/* or https://
  const isValidUrl = src.startsWith('/images/') || src.startsWith('https://');

  if (!isValidUrl || error) {
    return null; // Don't render if URL is invalid or image failed to load
  }

  return (
    <figure className="my-4">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setError(true)}
        className="max-w-full h-auto rounded-md border border-hairline"
      />
      {alt && (
        <figcaption className="text-sm text-text-muted text-center mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}
