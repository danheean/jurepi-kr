'use client';

import { useTranslations } from 'next-intl';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  soundOn: boolean;
  onToggle: () => void;
}

/**
 * Speaker icon button to toggle sound on/off.
 */
export function SoundToggle({ soundOn, onToggle }: SoundToggleProps) {
  const t = useTranslations('tools.charades');

  return (
    <button
      onClick={onToggle}
      // Action-labeled toggle: the label names what the click does. When sound is
      // ON the action is to mute; when OFF the action is to unmute.
      aria-label={soundOn ? t('sound.mute') : t('sound.unmute')}
      className="p-3 hover:bg-surface-muted rounded-lg transition-colors"
      data-testid="sound-toggle"
    >
      {soundOn ? (
        <Volume2 size={20} className="text-text" />
      ) : (
        <VolumeX size={20} className="text-text-secondary" />
      )}
    </button>
  );
}
