'use client';

import { useEffect, useState } from 'react';
import { CheerDisplay } from './CheerDisplay';
import { CheerStage } from './CheerStage';
import { CheerInput } from './CheerInput';
import { CheerPresets } from './CheerPresets';
import { CheerControls } from './CheerControls';
import { useCheer } from './useCheer';

/**
 * Orchestrator component. Owns useCheer() hook. Mounted gate for localStorage-only parts.
 *
 * Layout: settings LEFT · preview RIGHT on desktop. On mobile the preview sits on
 * top and sticks while you scroll the controls, so the banner is always visible.
 * The immersive fullscreen presentation is a separate overlay (CheerStage).
 */
export function Cheer() {
  const [mounted, setMounted] = useState(false);
  const cheer = useCheer();

  // Hydration-safe mounted gate
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Preview — DOM first so it's on top on mobile; moved right on desktop */}
        <div className="md:order-2 self-start sticky top-16 md:top-24 z-10 bg-surface pb-2 flex flex-col gap-4 min-w-0">
          <CheerDisplay settings={cheer.effectiveSettings} />
        </div>

        {/* Controls — left on desktop */}
        <div className="md:order-1 flex flex-col gap-6 min-w-0">
          <CheerInput
            text={cheer.settings.text}
            onChange={(text) => cheer.updateSettings({ text })}
            onCommit={(text) => cheer.commitMessage(text)}
            recents={cheer.recents}
            onSelectRecent={cheer.loadRecent}
          />

          <CheerPresets onApply={cheer.applyPreset} />

          <CheerControls
            settings={cheer.settings}
            onSettingsChange={cheer.updateSettings}
            isWakeLockSupported={cheer.isWakeLockSupported}
            isWakeLocked={cheer.isWakeLocked}
            onEnterFullscreen={cheer.startPresenting}
            onToggleWakeLock={cheer.toggleWakeLock}
          />
        </div>
      </div>

      {cheer.presenting && (
        <CheerStage
          settings={cheer.effectiveSettings}
          onClose={cheer.stopPresenting}
          enterFullscreen={cheer.enterFullscreen}
          isFullscreenSupported={cheer.isFullscreenSupported}
        />
      )}
    </div>
  );
}
