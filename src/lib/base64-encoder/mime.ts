/**
 * MIME type guessing utility.
 * Infers MIME type from filename extension or data-URI prefix.
 */

const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',

  // Archive
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.bz2': 'application/x-bzip2',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',

  // Other
  '.exe': 'application/x-msdownload',
  '.dll': 'application/x-msdownload',
  '.dmg': 'application/x-apple-diskimage',
};

/**
 * Guess MIME type from filename extension or data-URI prefix.
 * @param filename - Optional filename to extract extension from
 * @param base64Prefix - Optional data-URI prefix (e.g., "data:image/png;base64,")
 * @returns MIME type string, or "text/plain" as fallback
 */
export function guessMimeType(filename?: string, base64Prefix?: string): string {
  // Priority 1: Extract from data-URI prefix
  if (base64Prefix) {
    const mimeMatch = base64Prefix.match(/data:([^;,]+)/);
    if (mimeMatch && mimeMatch[1]) {
      return mimeMatch[1];
    }
  }

  // Priority 2: Extract from filename extension
  if (filename) {
    // Handle Windows paths
    const normalizedFilename = filename.replace(/\\/g, '/');
    // Get last component (filename, not directory)
    const baseName = normalizedFilename.split('/').pop() || '';
    // Get extension (lowercase)
    const lastDot = baseName.lastIndexOf('.');
    if (lastDot !== -1) {
      const ext = baseName.substring(lastDot).toLowerCase();
      if (ext in MIME_TYPE_MAP) {
        return MIME_TYPE_MAP[ext];
      }
    }
  }

  // Fallback: text/plain
  return 'text/plain';
}

/**
 * True when a MIME type represents human-readable text (so a decoded payload
 * should be shown as text rather than offered as a binary file download).
 */
export function isTextualMime(mimeType: string): boolean {
  const m = mimeType.toLowerCase().trim();
  return (
    m.startsWith('text/') ||
    m === 'application/json' ||
    m === 'application/xml' ||
    m === 'application/javascript' ||
    m === 'application/typescript' ||
    m === 'application/x-www-form-urlencoded' ||
    m.endsWith('+json') ||
    m.endsWith('+xml')
  );
}

// Reverse of MIME_TYPE_MAP: first extension wins per MIME (e.g. image/jpeg → jpg).
const MIME_TO_EXTENSION: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [ext, mime] of Object.entries(MIME_TYPE_MAP)) {
    if (!(mime in out)) out[mime] = ext.slice(1); // strip leading dot
  }
  return out;
})();

/**
 * Best-effort filename extension for a MIME type (without dot), for naming a
 * downloaded file. Falls back to "bin" for unknown types.
 */
export function extensionForMime(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType.toLowerCase().trim()] ?? 'bin';
}
