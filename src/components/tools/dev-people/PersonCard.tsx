import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MergedPerson } from '@/lib/dev-people/schema';
import { calculateAge } from '@/lib/dev-people/birthdate';

interface PersonCardProps {
  person: MergedPerson;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  locale: 'ko' | 'en';
}

export function PersonCard({
  person,
  isFavorited,
  onToggleFavorite,
  locale,
}: PersonCardProps) {
  const t = useTranslations('tools.dev-people');
  const localeData = locale === 'ko' ? person.ko : person.en;

  const ageInfo = calculateAge(person.birthYear, person.deathYear);
  const ageDisplay = ageInfo
    ? ageInfo.type === 'age'
      ? t('card.ageDisplay', { age: ageInfo.value })
      : t('card.ageAtDeath', { age: ageInfo.value })
    : null;

  const spokeUrl = `/${locale}/tools/dev-people/${person.slug}`;

  // Get first character for initials avatar
  const initial = localeData.name.charAt(0).toUpperCase();

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <div className="relative">
      <a
        href={spokeUrl}
        data-testid={`person-card-${person.slug}`}
        className="
          flex flex-col h-full relative text-left p-4 rounded-xl border border-hairline bg-surface
          transition-[color,box-shadow,border-color,transform] no-underline cursor-pointer
          hover:shadow-card-hover hover:translate-y-[-2px]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
        "
      >
        {/* Top: name + age/year display */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-text leading-tight">
            {localeData.name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {person.birthYear && person.deathYear
              ? `${person.birthYear}–${person.deathYear}`
              : person.birthYear
                ? t('spoke.born', { year: person.birthYear })
                : ''}
            {ageDisplay && (
              <>
                {' • '}
                {ageDisplay}
              </>
            )}
          </p>
        </div>

        {/* knownFor clamp-2-lines */}
        <p className="text-sm text-text-secondary mb-3 line-clamp-2 min-h-[2.5rem]">
          {localeData.knownFor}
        </p>

        {/* Tags and era badges — reserve 2 rows so the photo aligns across cards.
            NOTE: assumes ≤4 tags (+era) → fits 2 rows; 5+ tags would overflow to 3 rows. */}
        <div className="flex flex-wrap content-start gap-1.5 mb-3 min-h-[3.75rem]">
          {person.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-accent-sky-soft text-accent-sky-ink"
              data-testid={`person-tag-${tag}`}
            >
              {t(`tags.${tag}`)}
            </span>
          ))}
          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-surface-muted text-text-secondary">
            {t(`eras.${person.era}`)}
          </span>
        </div>

        {/* Photo or avatar */}
        {person.photo ? (
          <div
            className="mb-3 w-full aspect-square rounded-lg overflow-hidden bg-surface-sunken"
            data-testid="person-photo"
          >
            <img
              src={`/images/dev-people/${person.photo}`}
              alt={localeData.name}
              className="w-full h-full object-cover"
              loading="lazy"
              width={200}
              height={200}
            />
          </div>
        ) : (
          <div
            className="mb-3 w-full aspect-square rounded-lg bg-accent-sky-soft flex items-center justify-center text-2xl font-bold text-accent-sky-ink"
            data-testid="person-avatar"
          >
            {initial}
          </div>
        )}

        {/* Spacer for star button (positioned absolutely) */}
        <div className="sr-only">{t('card.toggleFavorite')}</div>
      </a>

      {/* Favorite toggle — sibling of the link, never nested */}
      <button
        type="button"
        onClick={handleStarClick}
        aria-pressed={isFavorited}
        aria-label={t('card.toggleFavorite')}
        className="
          absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full
          text-text-secondary hover:text-accent-sky-ink transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-sky-ink
        "
        data-testid={`person-star-${person.slug}`}
      >
        <Star
          className={`w-5 h-5 ${
            isFavorited ? 'fill-accent-sky-ink text-accent-sky-ink' : ''
          }`}
        />
      </button>
    </div>
  );
}
