import { useTranslations } from 'next-intl';
import { extractClaims, renderClaimValue, formatTimestamp, parseUnixSeconds } from '@/lib/jwt-decoder';

interface ClaimsTableProps {
  payload: Record<string, unknown>;
  locale: string;
}

const STANDARD_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'jti', 'typ', 'kid'] as const;

export function ClaimsTable({ payload, locale }: ClaimsTableProps) {
  const t = useTranslations('tools.jwt-decoder');

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { standard, custom } = extractClaims(payload);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium text-text mb-3">{t('claims.title')}</h3>

        {/* Standard Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left py-2 px-3 font-medium text-text-muted">
                  {t('claims.standard')}
                </th>
                <th className="text-left py-2 px-3 font-medium text-text-muted">{t('claims.value')}</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_CLAIMS.map((key) => {
                const value = standard[key];
                if (value === undefined) return null;

                const displayValue = renderClaimValue(key, value);
                const isTimestamp = ['exp', 'iat', 'nbf'].includes(key) && typeof value === 'number';
                const formattedTime = isTimestamp ? formatTimestamp(parseUnixSeconds(value as number), locale) : null;

                return (
                  <tr key={key} className="border-b border-hairline hover:bg-surface-sunken">
                    <td className="py-3 px-3 text-text-muted font-mono">
                      {t(`claims.${key}`)}
                    </td>
                    <td className="py-3 px-3 text-text font-mono break-all">
                      <div title={displayValue}>{displayValue}</div>
                      {formattedTime && (
                        <div className="text-xs text-text-muted mt-1">
                          {formattedTime.local}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Claims */}
      {Object.keys(custom).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text mb-3">{t('claims.custom')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left py-2 px-3 font-medium text-text-muted">{t('claims.key')}</th>
                  <th className="text-left py-2 px-3 font-medium text-text-muted">{t('claims.value')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(custom).map(([key, value]) => {
                  const displayValue = renderClaimValue(key, value);
                  return (
                    <tr key={key} className="border-b border-hairline hover:bg-surface-sunken">
                      <td className="py-3 px-3 text-text-muted font-mono">{key}</td>
                      <td className="py-3 px-3 text-text font-mono break-all" title={displayValue}>
                        {displayValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
