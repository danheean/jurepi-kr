import type { MergedRanking } from '@/lib/rankings/schema';
import { ExternalLink } from 'lucide-react';

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'] as const;

interface RankingItem {
  rank: number;
  name: string;
  description: string;
  link?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface RankingRowProps {
  item: RankingItem;
  ranking: MergedRanking;
  showLink: boolean;
  showImage: boolean;
}

export function RankingRow({ item, ranking, showLink, showImage }: RankingRowProps) {
  const isMedal = item.rank <= 3;
  const medal = MEDAL_EMOJI[item.rank - 1];

  return (
    <tr className="border-b border-hairline hover:bg-surface-muted transition-colors">
      {/* Rank cell */}
      <td className="px-3 py-3 whitespace-nowrap">
        {isMedal ? (
          <span className="text-lg" aria-label={`Rank ${item.rank}`}>
            {medal}
          </span>
        ) : (
          <span className="font-mono text-sm text-text-secondary" aria-label={`Rank ${item.rank}`}>
            {item.rank}.
          </span>
        )}
      </td>

      {/* Name cell — keep short names on one line; only wrap at word boundaries */}
      <td className="px-3 py-3 font-semibold text-text align-top">{item.name}</td>

      {/* Description cell — flows to fill the full-width table (no max-width cap,
          which previously forced character-by-character wrapping in the old
          narrow sidebar). */}
      <td className="px-3 py-3 text-text-secondary align-top leading-relaxed">{item.description}</td>

      {/* Link cell */}
      {showLink && (
        <td className="px-3 py-3 whitespace-nowrap">
          {item.link ? (
            <a
              href={item.link}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex items-center gap-1 text-accent-rose hover:text-accent-rose-soft transition-colors text-sm font-medium"
              aria-label={`Link: ${item.name}`}
            >
              <span>Link</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          ) : null}
        </td>
      )}

      {/* Image cell */}
      {showImage && (
        <td className="px-3 py-3 text-center">
          {item.imageUrl && item.imageWidth && item.imageHeight ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              width={item.imageWidth}
              height={item.imageHeight}
              className="h-12 w-12 rounded object-cover mx-auto"
              loading="lazy"
            />
          ) : null}
        </td>
      )}
    </tr>
  );
}
