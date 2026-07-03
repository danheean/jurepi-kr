/**
 * SNS share targets — pure domain (no react/next/DOM imports).
 *
 * Each target is a plain web share URL; opening it is the adapter's job
 * (window.open in the ShareButtons component). Instagram and KakaoTalk have
 * no web share URL (app-only / SDK-only) — they are covered by the mobile
 * native share sheet (Web Share API) in the component layer.
 */

export type ShareTargetId = 'naver' | 'x' | 'facebook' | 'threads' | 'telegram' | 'whatsapp';

export interface ShareTarget {
  id: ShareTargetId;
  /** i18n key under the `share` namespace (e.g. targets.naver) */
  labelKey: string;
}

export interface SharePayload {
  url: string;
  title: string;
}

/** External share targets in display order. */
export const SHARE_TARGETS: ShareTarget[] = [
  { id: 'naver', labelKey: 'targets.naver' },
  { id: 'x', labelKey: 'targets.x' },
  { id: 'facebook', labelKey: 'targets.facebook' },
  { id: 'threads', labelKey: 'targets.threads' },
  { id: 'telegram', labelKey: 'targets.telegram' },
  { id: 'whatsapp', labelKey: 'targets.whatsapp' },
];

/**
 * Build the share URL for a target. Pure: same input → same output.
 * All values are percent-encoded via URLSearchParams.
 */
export function buildShareUrl(id: ShareTargetId, { url, title }: SharePayload): string {
  switch (id) {
    case 'naver': {
      const params = new URLSearchParams({ url, title });
      return `https://share.naver.com/web/shareView?${params}`;
    }
    case 'x': {
      const params = new URLSearchParams({ url, text: title });
      return `https://twitter.com/intent/tweet?${params}`;
    }
    case 'facebook': {
      const params = new URLSearchParams({ u: url });
      return `https://www.facebook.com/sharer/sharer.php?${params}`;
    }
    case 'threads': {
      const params = new URLSearchParams({ text: `${title} ${url}` });
      return `https://www.threads.net/intent/post?${params}`;
    }
    case 'telegram': {
      const params = new URLSearchParams({ url, text: title });
      return `https://t.me/share/url?${params}`;
    }
    case 'whatsapp': {
      const params = new URLSearchParams({ text: `${title} ${url}` });
      return `https://wa.me/?${params}`;
    }
  }
}
