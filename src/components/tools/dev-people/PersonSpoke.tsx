import { useTranslations } from 'next-intl';
import type { MergedPerson } from '@/lib/dev-people/schema';
import { calculateAge } from '@/lib/dev-people/birthdate';
import { Markdown } from '@/components/markdown';
import { Disclaimer } from './Disclaimer';

interface PersonSpokeProps {
  person: MergedPerson;
  locale: 'ko' | 'en';
}

export function PersonSpoke({ person, locale }: PersonSpokeProps) {
  const t = useTranslations('tools.dev-people');
  const localeData = locale === 'ko' ? person.ko : person.en;

  const ageInfo = calculateAge(person.birthYear, person.deathYear);
  const ageDisplay = ageInfo
    ? ageInfo.type === 'age'
      ? t('card.ageDisplay', { age: ageInfo.value })
      : t('card.ageAtDeath', { age: ageInfo.value })
    : null;

  const getCountryName = (code: string, _locale: 'ko' | 'en') => {
    try {
      return new Intl.DisplayNames(_locale, { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  };

  const initial = localeData.name.charAt(0).toUpperCase();

  return (
    <article className="space-y-8 max-w-4xl">
      {/* Header: name, birth/death, nationality, badges, photo/avatar */}
      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-text">{localeData.name}</h1>

        {/* Birth/death/age/nationality line */}
        <div className="text-lg text-text-secondary space-y-2">
          {person.birthYear && person.deathYear && (
            <p>
              {person.birthYear}–{person.deathYear}
              {ageDisplay && (
                <>
                  {' • '}
                  {ageDisplay}
                </>
              )}
            </p>
          )}
          {person.birthYear && !person.deathYear && (
            <p>
              {t('spoke.born', { year: person.birthYear })}
              {ageDisplay && (
                <>
                  {' • '}
                  {ageDisplay}
                </>
              )}
            </p>
          )}
          {person.nationality && (
            <p className="text-base">
              {getCountryName(person.nationality, locale)}
            </p>
          )}
        </div>

        {/* Tags and era badges */}
        <div className="flex flex-wrap gap-2">
          {person.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent-sky-soft text-accent-sky-ink"
            >
              {t(`tags.${tag}`)}
            </span>
          ))}
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-surface-muted text-text-secondary">
            {t(`eras.${person.era}`)}
          </span>
        </div>

        {/* Photo or avatar */}
        {person.photo ? (
          <figure className="space-y-2">
            <div className="w-full max-w-[28rem] rounded-lg overflow-hidden bg-surface-sunken">
              <img
                src={`/images/dev-people/${person.photo}`}
                alt={localeData.name}
                className="w-full h-auto"
                loading="eager"
                width={300}
                height={400}
              />
            </div>
            {person.photoCredit && (
              <figcaption className="text-xs text-text-muted">
                {person.photoCredit}
              </figcaption>
            )}
          </figure>
        ) : (
          <div
            className="w-32 h-32 rounded-lg bg-accent-sky-soft flex items-center justify-center text-4xl font-bold text-accent-sky-ink"
          >
            {initial}
          </div>
        )}
      </header>

      {/* Biography (SSR'd outside mounted gate) — 본문 마크다운이 자체 "## 소개/## 일화" 헤딩을
          가지므로 여기서 별도 섹션 헤딩을 얹지 않는다(이중 헤딩 방지) */}
      {localeData.biography_body && (
        <section className="space-y-4">
          <Markdown className="text-text-secondary">
            {localeData.biography_body}
          </Markdown>
        </section>
      )}

      {/* Achievements timeline */}
      {person.achievements && person.achievements.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text">{t('spoke.achievements')}</h2>
          <ul className="space-y-3">
            {person.achievements.map((achievement, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="text-text-secondary font-semibold shrink-0">
                  {achievement.year}
                </span>
                <span className="text-text-secondary">
                  {locale === 'ko' ? achievement.ko : achievement.en}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Books */}
      {person.books && person.books.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text">{t('spoke.books')}</h2>
          <ul className="space-y-2">
            {person.books.map((book, idx) => {
              const bookTitle = locale === 'ko' ? book.ko : book.en;
              return (
                <li key={idx} className="text-text-secondary">
                  {book.url ? (
                    <a
                      href={book.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="text-accent-sky-ink hover:underline"
                    >
                      {bookTitle}
                    </a>
                  ) : (
                    <span>{bookTitle}</span>
                  )}
                  {book.year && <span> ({book.year})</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* External links */}
      {person.links && person.links.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text">{t('spoke.links')}</h2>
          <ul className="space-y-2">
            {person.links.map((link, idx) => (
              <li key={idx}>
                <a
                  href={link.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-accent-sky-ink hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Disclaimer */}
      <Disclaimer />
    </article>
  );
}
