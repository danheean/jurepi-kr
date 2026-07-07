/**
 * Loading skeleton for find-replace tool, shown before the client tool mounts.
 * Mirrors the live 2-column layout exactly so replacing it causes no layout shift (CLS 0).
 * aria-hidden; SSR sections (H1/intro/how-to/FAQ) carry accessible content.
 */
export function FindReplaceSkeleton() {
  const block = 'bg-surface-muted rounded';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse" aria-hidden="true">
      {/* Left: source text input */}
      <div className="lg:col-span-2 flex flex-col gap-2">
        <div className={`h-4 w-24 ${block}`} />
        <div className="flex-1 min-h-80 rounded-lg border border-hairline bg-surface-muted" />
        <div className={`h-3 w-32 ${block}`} />
      </div>

      {/* Right: rules, presets, result sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Rule list */}
        <div className="space-y-3">
          <div className={`h-4 w-16 ${block}`} />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg border border-hairline p-3 space-y-2">
                <div className={`h-8 w-full ${block}`} />
                <div className={`h-8 w-full ${block}`} />
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className={`h-5 w-5 ${block}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={`h-9 w-full rounded-lg ${block}`} />
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <div className={`h-4 w-20 ${block}`} />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-8 flex-1 rounded ${block}`} />
            ))}
          </div>
        </div>

        {/* Result card */}
        <div className="bg-surface rounded-xl border border-hairline p-4 space-y-2">
          <div className={`h-4 w-24 ${block}`} />
          <div className="min-h-20 rounded bg-surface-muted" />
          <div className="flex gap-2">
            <div className={`h-9 flex-1 rounded ${block}`} />
            <div className={`h-9 flex-1 rounded ${block}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
