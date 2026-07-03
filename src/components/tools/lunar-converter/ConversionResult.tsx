'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import type { ConversionResult as ConversionResultType } from '@/lib/lunar-converter/schema';

interface ConversionResultProps {
  result: ConversionResultType | null;
  onCopy: (key: 'solar' | 'lunar' | 'both') => void;
  copyKey: 'solar' | 'lunar' | 'both' | null;
}

export function ConversionResult({ result, onCopy, copyKey }: ConversionResultProps) {
  const t = useTranslations('tools.lunar-converter');
  const locale = useLocale();

  if (!result) {
    return (
      <div className="p-6 rounded-lg bg-surface-muted border border-hairline text-center">
        <p className="text-text-secondary text-sm">{t('recents.empty')}</p>
      </div>
    );
  }

  const solarDate = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(result.solarDate.year, result.solarDate.month - 1, result.solarDate.day));

  const leapSuffix = result.lunarDate.isLeap ? ` ${t('result.leap')}` : '';
  const pad = (n: number) => String(n).padStart(2, '0');
  // Lunar months do NOT map to Gregorian month names, so English uses a numeric
  // format (a Gregorian month name would be factually wrong for a lunar month).
  const lunarDateStr =
    locale === 'en'
      ? `${result.lunarDate.year}-${pad(result.lunarDate.month)}-${pad(result.lunarDate.day)}${leapSuffix}`
      : `${result.lunarDate.year}년 ${result.lunarDate.month}월 ${result.lunarDate.day}일${leapSuffix}`;

  return (
    <div className="space-y-6">
      {/* Solar Date */}
      <div className="p-4 rounded-lg bg-surface-muted border border-hairline">
        <h3 className="text-xs uppercase font-semibold text-text-secondary mb-2">{t('result.solarLabel')}</h3>
        <p className="text-lg font-semibold text-text mb-3">{solarDate}</p>
        <button
          onClick={() => onCopy('solar')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
            copyKey === 'solar'
              ? 'bg-success text-white'
              : 'bg-white border border-hairline text-text hover:bg-surface'
          }`}
          aria-label={t('result.copyButtons.solar')}
        >
          {copyKey === 'solar' ? (
            <>
              <Check className="w-4 h-4" />
              {t('result.copyButtons.copied')}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t('result.copyButtons.solar')}
            </>
          )}
        </button>
      </div>

      {/* Lunar Date */}
      <div className="p-4 rounded-lg bg-surface-muted border border-hairline">
        <h3 className="text-xs uppercase font-semibold text-text-secondary mb-2">{t('result.lunarLabel')}</h3>
        <p className="text-lg font-semibold text-text mb-3">{lunarDateStr}</p>
        <button
          onClick={() => onCopy('lunar')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
            copyKey === 'lunar'
              ? 'bg-success text-white'
              : 'bg-white border border-hairline text-text hover:bg-surface'
          }`}
          aria-label={t('result.copyButtons.lunar')}
        >
          {copyKey === 'lunar' ? (
            <>
              <Check className="w-4 h-4" />
              {t('result.copyButtons.copied')}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t('result.copyButtons.lunar')}
            </>
          )}
        </button>
      </div>

      {/* Sexagenary & Zodiac */}
      <div className="grid grid-cols-2 gap-4">
        {/* Sexagenary */}
        <div className="p-4 rounded-lg bg-accent-grape-soft border border-accent-grape">
          <h3 className="text-xs uppercase font-semibold text-accent-grape-ink mb-2">{t('result.sexagenary')}</h3>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-text">{result.sexagenary.name}</p>
            <p className="text-sm text-text-secondary">{result.sexagenary.hanja}</p>
            <p className="text-xs text-text-muted">{result.sexagenary.english}</p>
          </div>
        </div>

        {/* Zodiac */}
        <div className="p-4 rounded-lg bg-accent-coral-soft border border-accent-coral">
          <h3 className="text-xs uppercase font-semibold text-text mb-2">{t('result.zodiac')}</h3>
          <div className="space-y-1">
            <p className="text-3xl">{result.zodiac.emoji}</p>
            <p className="text-sm font-semibold text-text">{t(`zodiac.${result.zodiac.key}`)}</p>
          </div>
        </div>
      </div>

      {/* Copy Both */}
      <button
        onClick={() => onCopy('both')}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
          copyKey === 'both'
            ? 'bg-brand text-on-brand'
            : 'bg-brand text-on-brand hover:bg-brand-strong'
        }`}
        aria-label={t('result.copyButtons.both')}
      >
        {copyKey === 'both' ? (
          <>
            <Check className="w-4 h-4" />
            {t('result.copyButtons.copied')}
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            {t('result.copyButtons.both')}
          </>
        )}
      </button>
    </div>
  );
}
