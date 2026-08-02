'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BirthProfile, Locale } from '@/lib/birthday-secret/schema';
import { monthSlug, parseMonthDay } from '@/lib/birthday-secret/date';
import { googleImageUrl, otanjoubiUrl } from '@/lib/birthday-secret/external-links';
import { ShareButtons } from '@/components/share';
import { downloadProfileImage } from './profile-image';

interface ProfileCardProps {
  profile: BirthProfile;
  compact?: boolean;
}

const googleLinkClass =
  'inline-flex min-h-[36px] items-center text-sm font-medium text-accent-rose-ink underline ' +
  'underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

export function ProfileCard({ profile, compact = false }: ProfileCardProps) {
  const t = useTranslations('tools.birthday-secret');
  const locale = useLocale() as Locale;
  const [saved, setSaved] = useState(false);

  const parsed = parseMonthDay(profile.date)!;
  const monthLabel = t(`months.${monthSlug(parsed.month)}`);
  const dateText = locale === 'ko' ? `${monthLabel} ${parsed.day}일` : `${monthLabel} ${parsed.day}`;

  const flower = profile.flower[locale];
  const stone = profile.stone[locale];
  const colorLoc = profile.color[locale];

  const handleDownload = async () => {
    const ok = await downloadProfileImage(profile, locale, {
      brand: t('spoke.toolName'),
      dateText,
      flowerTitle: t('result.flowerTitle'),
      stoneTitle: t('result.stoneTitle'),
      colorTitle: t('result.colorTitle'),
      siteUrl: 'apps.jurepi.kr',
    });
    if (ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <section
      aria-label={dateText}
      className="rounded-2xl border border-hairline bg-surface p-5 shadow-card"
    >
      <p className="mb-4 text-lg font-bold text-text">{dateText}</p>

      <div className="space-y-3">
        {/* Flower */}
        <article className="rounded-xl bg-surface-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-rose-ink">
            🌸 {t('result.flowerTitle')}
          </p>
          <p className="mt-1 text-lg font-bold text-text">{flower.name}</p>
          {flower.meaning && (
            <p className="mt-0.5 text-sm text-text-secondary">
              {t('result.flowerMeaning')} · {flower.meaning}
            </p>
          )}
          <a href={googleImageUrl(profile.flower.googleQuery[locale])} target="_blank" rel="noopener noreferrer" className={googleLinkClass}>
            {t('result.googleImage')}
          </a>
        </article>

        {/* Stone */}
        <article className="rounded-xl bg-surface-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-rose-ink">
            💎 {t('result.stoneTitle')}
          </p>
          <div className="mt-1 flex items-start gap-3">
            <div
              className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken"
              data-testid="stone-illustration"
            >
              <img
                src={`/images/birthday-secret/stones/${String(parsed.month).padStart(2, '0')}.webp`}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-text">{stone.name}</p>
              <p className="mt-0.5 text-sm text-text-secondary">{t('result.stoneMeaning')} · {stone.meaning}</p>
              {!compact && (
                <p className="mt-1 text-xs text-text-muted">
                  {t('result.colorName')}: {stone.color} · {t('result.hardness')}: {stone.hardness} · {t('result.origin')}: {stone.origin}
                </p>
              )}
            </div>
          </div>
          <a href={googleImageUrl(profile.stone.googleQuery[locale])} target="_blank" rel="noopener noreferrer" className={`${googleLinkClass} mt-2`}>
            {t('result.googleImage')}
          </a>
        </article>

        {/* Color */}
        <article className="rounded-xl bg-surface-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-rose-ink">
            🎨 {t('result.colorTitle')}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span
              className="h-12 w-12 shrink-0 rounded-lg border border-hairline"
              style={{ background: profile.color.hex }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold text-text">{colorLoc.name}</p>
              <p className="text-sm text-text-secondary">
                {colorLoc.keyword} · <span className="font-mono">{profile.color.hex}</span>
              </p>
            </div>
          </div>
        </article>
      </div>

      {!compact && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="min-h-[44px] rounded-xl bg-brand px-4 font-semibold text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-safe:active:scale-95"
            >
              {saved ? t('result.downloaded') : t('result.download')}
            </button>
            <a
              href={otanjoubiUrl(parsed.month, parsed.day)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-hairline px-4 font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {t('result.moreInfo')}
            </a>
          </div>
          <div aria-live="polite" className="sr-only">
            {saved ? t('result.downloaded') : ''}
          </div>
          <div className="mt-4">
            <ShareButtons title={`${t('spoke.toolName')} · ${dateText}`} />
          </div>
          <p className="mt-4 text-xs text-text-muted">{t('result.disclaimer')}</p>
        </>
      )}
    </section>
  );
}
