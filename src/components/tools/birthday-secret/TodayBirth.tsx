'use client';

import { useTranslations } from 'next-intl';
import type { BirthProfile } from '@/lib/birthday-secret/schema';
import { ProfileCard } from './ProfileCard';

interface TodayBirthProps {
  profile: BirthProfile | null;
}

export function TodayBirth({ profile }: TodayBirthProps) {
  const t = useTranslations('tools.birthday-secret');
  if (!profile) return null;
  return (
    <section aria-labelledby="bs-today-heading" className="space-y-3">
      <div>
        <h2 id="bs-today-heading" className="text-lg font-bold text-text">
          {t('today.title')}
        </h2>
        <p className="text-sm text-text-secondary">{t('today.subtitle')}</p>
      </div>
      <ProfileCard profile={profile} compact />
    </section>
  );
}
