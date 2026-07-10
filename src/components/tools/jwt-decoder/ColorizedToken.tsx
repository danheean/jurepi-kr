import { useTranslations } from 'next-intl';

interface ColorizedTokenProps {
  header?: string;
  payload?: string;
  signature?: string;
  error?: boolean;
}

export function ColorizedToken({
  header = '',
  payload = '',
  signature = '',
  error = false,
}: ColorizedTokenProps) {
  const t = useTranslations('tools.jwt-decoder');

  if (error) {
    return null;
  }

  const truncate = (str: string, maxLen: number = 30) => {
    if (str.length > maxLen) {
      return str.substring(0, maxLen) + '…';
    }
    return str;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="font-mono text-sm bg-surface p-4 rounded-lg break-all">
        <span className="text-accent-sun-ink font-semibold" title={header}>
          {truncate(header)}
        </span>
        <span className="text-text mx-1">.</span>
        <span className="text-accent-mint-ink font-semibold" title={payload}>
          {truncate(payload)}
        </span>
        <span className="text-text mx-1">.</span>
        <span className="text-accent-sky-ink font-semibold" title={signature}>
          {truncate(signature)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-xs text-text-muted mb-1">{t('tabs.header')}</p>
          <p className="text-xs font-mono text-accent-sun-ink truncate">{truncate(header, 12)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted mb-1">{t('tabs.payload')}</p>
          <p className="text-xs font-mono text-accent-mint-ink truncate">{truncate(payload, 12)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted mb-1">{t('tabs.signature')}</p>
          <p className="text-xs font-mono text-accent-sky-ink truncate">{truncate(signature, 12)}</p>
        </div>
      </div>
    </div>
  );
}
