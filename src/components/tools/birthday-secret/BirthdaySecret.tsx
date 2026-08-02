'use client';

import { useTranslations } from 'next-intl';
import { useBirthdaySecret } from './useBirthdaySecret';
import { BirthdayInput } from './BirthdayInput';
import { ProfileCard } from './ProfileCard';
import { TodayBirth } from './TodayBirth';
import { CoupleMode } from './CoupleMode';
import { RecentsList } from './RecentsList';

export function BirthdaySecret() {
  const t = useTranslations('tools.birthday-secret');
  const bs = useBirthdaySecret();

  return (
    <div className="space-y-8">
      {/* Input */}
      <section aria-labelledby="bs-input-heading" className="space-y-4">
        <h2 id="bs-input-heading" className="sr-only">
          {t('input.submit')}
        </h2>
        <BirthdayInput value={bs.dateKey} onSelect={bs.selectDate} idPrefix="bs-me" showLunarLink />
      </section>

      {/* Result */}
      <section aria-live="polite">
        {bs.profile ? (
          <ProfileCard profile={bs.profile} />
        ) : (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface-muted p-8 text-center text-text-secondary">
            {t('result.empty')}
          </p>
        )}
      </section>

      {/* Recent lookups */}
      {bs.recents.length > 0 && (
        <RecentsList recents={bs.recents} onSelectRecent={bs.selectKey} onClear={bs.clearRecents} />
      )}

      {/* Couple toggle */}
      <div>
        <button
          type="button"
          onClick={() => bs.setCoupleMode(!bs.coupleMode)}
          aria-pressed={bs.coupleMode}
          className="min-h-[44px] rounded-xl border border-hairline bg-surface px-4 font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {bs.coupleMode ? t('couple.single') : t('couple.toggle')}
        </button>
      </div>

      {bs.coupleMode && (
        <CoupleMode
          myProfile={bs.profile}
          partnerKey={bs.partnerKey}
          onSelectPartner={bs.selectPartner}
          coupleView={bs.coupleView}
        />
      )}

      {/* Today */}
      <TodayBirth profile={bs.todayProfile} />
    </div>
  );
}
