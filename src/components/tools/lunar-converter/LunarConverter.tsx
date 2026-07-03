'use client';

import { useState, useEffect } from 'react';
import { useConverter } from './useConverter';
import { SolarInput } from './SolarInput';
import { LunarInput } from './LunarInput';
import { TodayButton } from './TodayButton';
import { ConversionResult } from './ConversionResult';
import { RecentsList } from './RecentsList';
import { ErrorMessage } from './ErrorMessage';

interface LunarConverterProps {
  locale?: string;
}

export function LunarConverter({ locale }: LunarConverterProps) {
  const {
    solarYear,
    solarMonth,
    solarDay,
    lunarYear,
    lunarMonth,
    lunarDay,
    lunarIsLeap,
    result,
    recents,
    copyKey,
    isMounted,
    setSolar,
    setLunar,
    setToday,
    copy,
    loadRecent,
  } = useConverter();

  const [mounted, setMounted] = useState(false);

  // Mounted gate for localStorage interactions
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isMounted) {
    return null;
  }

  // Determine if result is an error
  const isError = result && 'error' in result;
  const isSuccess = result && !('error' in result);

  return (
    <div className="space-y-8">
      {/* Main 2-column layout: desktop, stacked mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: inputs */}
        <div className="space-y-6">
          {/* Solar input */}
          <SolarInput
            year={solarYear}
            month={solarMonth}
            day={solarDay}
            onChange={setSolar}
          />

          {/* Lunar input */}
          <LunarInput
            year={lunarYear}
            month={lunarMonth}
            day={lunarDay}
            isLeap={lunarIsLeap}
            onChange={setLunar}
          />

          {/* Today button */}
          <TodayButton onSetToday={setToday} />

          {/* Error message */}
          {isError && <ErrorMessage error={result} />}
        </div>

        {/* Right column: result (sticky on desktop) */}
        <div className="lg:sticky lg:top-8 h-fit space-y-6">
          {/* Result display */}
          {isSuccess && (
            <ConversionResult
              result={result}
              onCopy={copy}
              copyKey={copyKey}
            />
          )}

          {/* Recents list */}
          {isMounted && recents.length > 0 && (
            <RecentsList
              recents={recents}
              onSelectRecent={loadRecent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
