/**
 * Pure helper functions for extracting and generating YouTube video URLs.
 * Used by:
 * - Generator (scripts/generate-bookmarks.mjs) to bake youtubeId at build time
 * - UI components (ui-engineer) to render embeds/thumbnails at runtime
 *
 * CRITICAL: video ID extraction logic must be IDENTICAL in:
 * 1. This file (TypeScript, single source of truth)
 * 2. Generator (scripts/generate-bookmarks.mjs — replicate regexes as inline code; comment points back here)
 */

/**
 * Extract the 11-character YouTube video ID from a URL.
 * Returns null if the URL is not an embeddable video link (e.g., channel, playlist, search).
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=ID (+ any other query params)
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 *
 * NOT supported (returns null):
 * - Channels (/channel/..., /@handle, /c/..., /user/...)
 * - Playlists (?list=... without v=...)
 * - Search results
 * - Any non-YouTube URL
 *
 * @param url - The full URL string to parse
 * @returns The 11-character video ID, or null if not embeddable
 */
export function extractYoutubeId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname || '';

    // Check if this is a YouTube domain
    if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
      return null;
    }

    // Handle youtu.be short links: https://youtu.be/ID
    if (hostname.includes('youtu.be')) {
      const pathname = urlObj.pathname;
      const match = pathname.match(/^\/([A-Za-z0-9_-]{11})$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }

    // Handle youtube.com URLs
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // /watch?v=ID — the standard video URL
    if (pathname === '/watch') {
      const videoId = searchParams.get('v');
      if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        // Make sure it's not a playlist-only URL (list=X without v=)
        // If both v= and list= exist, v= takes priority (embeddable)
        return videoId;
      }
      return null;
    }

    // /embed/ID
    if (pathname.startsWith('/embed/')) {
      const match = pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }

    // /shorts/ID
    if (pathname.startsWith('/shorts/')) {
      const match = pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }

    // Reject all other paths (channels, playlists, search, etc.)
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate the high-quality thumbnail URL for a YouTube video.
 * @param id - The 11-character YouTube video ID
 * @returns The HTTPS URL to the HQ default thumbnail
 */
export function youtubeThumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Generate the embed URL for a YouTube video (youtube-nocookie domain).
 * @param id - The 11-character YouTube video ID
 * @returns The HTTPS URL to the embed endpoint with autoplay and minimal rel
 */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
