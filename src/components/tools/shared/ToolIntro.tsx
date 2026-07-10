import type { AccentColor } from '@/tools/types';
import { ToolCharacter } from '@/components/tools/ToolCharacter';
import { accentEyebrowClass } from '@/components/home/toolStyle';

interface ToolIntroProps {
  /** Tool slug → drives the themed avatar. */
  slug: string;
  /** Category eyebrow label (e.g. "맛집 도구"). */
  eyebrow: string;
  /** Tool title (rendered as the page H1). */
  title: string;
  /** One-sentence lead / description. */
  description: string;
  /** Category accent — colors the eyebrow. */
  accent: AccentColor;
}

/**
 * Shared tool-page header. Every tool detail page renders exactly one of these
 * at the route level (see `[locale]/tools/[slug]/page.tsx`), so the title area
 * is uniform across all tools: same avatar-beside-title layout, same branded
 * display H1 (`text-display-lg`), same body-lg lead, and an eyebrow colored by
 * the tool's category accent. Server-compatible (no client hooks) so it lands
 * in the prerendered HTML for SEO/GEO.
 */
export function ToolIntro({
  slug,
  eyebrow,
  title,
  description,
  accent,
}: ToolIntroProps) {
  return (
    <header className="mb-10 space-y-4">
      <div className="flex items-start gap-4">
        <ToolCharacter
          slug={slug}
          className="h-auto w-16 shrink-0 rounded-2xl shadow-card sm:w-[72px]"
        />
        <div className="min-w-0 space-y-2">
          <p
            className={`text-xs font-bold uppercase tracking-widest ${accentEyebrowClass(accent)}`}
          >
            {eyebrow}
          </p>
          <h1 className="font-display text-display-lg font-bold text-text break-words">
            {title}
          </h1>
        </div>
      </div>
      <p className="max-w-2xl text-body-lg leading-relaxed text-text-secondary">
        {description}
      </p>
    </header>
  );
}
