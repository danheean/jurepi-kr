import { useTranslations } from 'next-intl';
import { JsonStats } from '@/lib/json-formatter';

interface JsonFormatterStatsProps {
  stats: JsonStats | null;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
}

export function JsonFormatterStats({
  stats,
  className = '',
}: JsonFormatterStatsProps) {
  const t = useTranslations('tools.json-formatter');

  if (!stats) {
    return null;
  }

  return (
    <div className={`text-sm text-text-secondary py-2 px-4 ${className}`}>
      {t('stats.display', {
        size: formatBytes(stats.byteSize),
        elements: stats.elementCount,
        depth: stats.depth,
      })}
    </div>
  );
}
