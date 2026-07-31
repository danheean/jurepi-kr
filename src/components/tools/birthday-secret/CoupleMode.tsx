'use client';

import { useTranslations } from 'next-intl';
import type { BirthProfile } from '@/lib/birthday-secret/schema';
import type { CoupleView } from '@/lib/birthday-secret/couple';
import { BirthdayInput } from './BirthdayInput';
import { ProfileCard } from './ProfileCard';
import { ColorPalette } from './ColorPalette';

interface CoupleModeProps {
  myProfile: BirthProfile | null;
  partnerKey: string | null;
  onSelectPartner: (month: number, day: number) => void;
  coupleView: CoupleView | null;
}

export function CoupleMode({ myProfile, partnerKey, onSelectPartner, coupleView }: CoupleModeProps) {
  const t = useTranslations('tools.birthday-secret');

  return (
    <section aria-labelledby="bs-couple-heading" className="space-y-4 rounded-2xl border border-hairline bg-surface-muted p-4">
      <h2 id="bs-couple-heading" className="sr-only">
        {t('couple.toggle')}
      </h2>

      <div>
        <p className="mb-2 text-sm font-semibold text-text">{t('couple.partner')}</p>
        <BirthdayInput value={partnerKey} onSelect={onSelectPartner} idPrefix="bs-partner" />
      </div>

      {coupleView && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-secondary">{t('couple.you')}</p>
            {myProfile && <ProfileCard profile={myProfile} compact />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-secondary">{t('couple.partner')}</p>
            <ProfileCard profile={coupleView.b} compact />
          </div>
        </div>
      )}

      {coupleView && (
        <div className="rounded-xl bg-surface p-4">
          <p className="text-sm font-semibold text-text">{t('couple.combined')}</p>
          <div className="mt-2 flex items-center gap-3">
            <ColorPalette hexes={coupleView.palette} />
            <p className="text-sm text-text-secondary">
              {coupleView.sameMonth ? t('couple.sameMonth') : t('couple.diffMonth')}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
