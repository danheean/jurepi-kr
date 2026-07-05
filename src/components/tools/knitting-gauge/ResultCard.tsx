'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { CountResult } from '@/lib/knitting-gauge/gauge'

interface ResultCardProps {
  label: string
  result: CountResult | null
  unitLabel: string
  copySummary?: string
}

export function ResultCard({
  label,
  result,
  unitLabel,
  copySummary,
}: ResultCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const handleCopy = async () => {
    if (!copySummary) return
    try {
      await navigator.clipboard.writeText(copySummary)
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-6">
      <p className="mb-4 text-sm font-medium text-text-secondary">{label}</p>

      {result === null ? (
        <p className="text-sm text-text-muted">—</p>
      ) : (
        <>
          {/* Rounded value - large, prominent */}
          <div className="mb-3">
            <p
              className="font-sans text-5xl font-bold tracking-tight text-accent-sun-ink"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {nf.format(result.rounded)}
            </p>
          </div>

          {/* Exact value - smaller, secondary */}
          <p className="mb-4 text-sm text-text-muted">
            {t('tools.knitting-gauge.results.exact')}: {nf.format(result.value)}
          </p>

          {/* Actual dimension ± delta (delta rounded at display precision, -0 normalized) */}
          {result.actual !== undefined && result.delta !== undefined && (() => {
            const displayDelta = Math.round(result.delta * 100) / 100 + 0
            return (
              <p className="mb-4 text-sm text-text-muted">
                {t('tools.knitting-gauge.results.actual')}: {nf.format(result.actual)}
                {unitLabel} ({displayDelta >= 0 ? '+' : ''}{nf.format(displayDelta)}
                {unitLabel})
              </p>
            )
          })()}

          {/* Copy button */}
          {copySummary && (
            <button
              onClick={handleCopy}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-hairline bg-surface-muted px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted/80 active:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={t(copied ? 'tools.knitting-gauge.actions.copied' : 'tools.knitting-gauge.actions.copy')}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {t(copied ? 'tools.knitting-gauge.actions.copied' : 'tools.knitting-gauge.actions.copy')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
