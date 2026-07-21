import type { CheerSettings, CheerSize, DeviceType } from './schema';

/**
 * Length → size bucket thresholds, ordered smallest-max-first.
 *
 * Counter-intuitively, tablet's thresholds are *tighter* than mobile's, not
 * looser. CheerDisplay's font size is set with CSS clamp() driven by vw units
 * (percent of viewport *width*), while the display box height is 100dvh (the
 * device's actual, fixed height). A tablet held in portrait is wider relative
 * to its height than a phone is (phones are tall and narrow), so on a tablet
 * the vw-scaled font grows faster relative to the available vertical room —
 * the same character count wraps into lines that eat the box height sooner.
 * These exact cutoffs were measured empirically (cloned-node natural-height
 * vs. box clientHeight, in both the inline preview and the CheerStage
 * fullscreen overlay) at representative phone (375×812) and tablet
 * (810×1080) viewports, then given a safety margin so real mixed text
 * (spaces/punctuation, narrower than solid Hangul) never gets closer to the
 * box edge than the worst case tested.
 */
const AUTO_SIZE_THRESHOLDS: Record<DeviceType, ReadonlyArray<{ maxLength: number; size: CheerSize }>> = {
  mobile: [
    { maxLength: 10, size: 'XL' },
    { maxLength: 28, size: 'L' },
    { maxLength: 55, size: 'M' },
    { maxLength: Infinity, size: 'S' },
  ],
  tablet: [
    { maxLength: 6, size: 'XL' },
    { maxLength: 18, size: 'L' },
    { maxLength: 50, size: 'M' },
    { maxLength: Infinity, size: 'S' },
  ],
};

/**
 * Suggest a size bucket for the given text length and device type.
 * Longer text gets a smaller bucket so it doesn't wrap past the display box
 * and get visually clipped; shorter text gets a larger bucket so it isn't
 * lost on a big screen.
 */
export function suggestAutoSize(textLength: number, deviceType: DeviceType): CheerSize {
  const thresholds = AUTO_SIZE_THRESHOLDS[deviceType];
  const match = thresholds.find((entry) => textLength <= entry.maxLength);
  return match ? match.size : 'S';
}

/**
 * Resolve the size that should actually be rendered: the derived auto size
 * when sizeMode is 'auto', otherwise the user's manually-picked size.
 */
export function resolveEffectiveSize(settings: CheerSettings): CheerSize {
  if (settings.sizeMode === 'auto') {
    return suggestAutoSize(settings.text.length, settings.deviceType);
  }
  return settings.size;
}
