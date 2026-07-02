import type { MergedTopic } from '@/lib/bookmarks/schema';
import { LinkRow } from './LinkRow';

interface TopicSectionsProps {
  sections: MergedTopic['ko']['sections'];
  locale: 'ko' | 'en';
}

export function TopicSections({ sections, locale }: TopicSectionsProps) {
  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {section.heading}
          </h3>
          <ul className="space-y-2">
            {section.links.map((link, linkIdx) => (
              <li key={linkIdx}>
                <LinkRow
                  label={link.label}
                  url={link.url}
                  description={link.description}
                  locale={locale}
                  youtubeId={link.youtubeId}
                  image={link.image}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
