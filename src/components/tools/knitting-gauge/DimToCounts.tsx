'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { CountResult } from '@/lib/knitting-gauge/gauge'
import { ResultCard } from './ResultCard'

interface DimToCountsProps {
  targetWidth: number
  targetLength: number
  onTargetWidthChange: (value: number) => void
  onTargetLengthChange: (value: number) => void
  result: {
    stitches: CountResult
    rows: CountResult
  }
  unitLabel: string
}

export function DimToCounts({
  targetWidth,
  targetLength,
  onTargetWidthChange,
  onTargetLengthChange,
  result,
  unitLabel,
}: DimToCountsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const [widthDraft, setWidthDraft] = useState(String(targetWidth))
  const [lengthDraft, setLengthDraft] = useState(String(targetLength))

  // Sync drafts when the committed value changes externally (e.g. unit toggle)
  useEffect(() => {
    setWidthDraft((d) => (parseFloat(d) === targetWidth ? d : String(targetWidth)))
  }, [targetWidth])
  useEffect(() => {
    setLengthDraft((d) => (parseFloat(d) === targetLength ? d : String(targetLength)))
  }, [targetLength])

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setWidthDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onTargetWidthChange(num)
    }
  }

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setLengthDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onTargetLengthChange(num)
    }
  }

  const stCopySummary = `${nf.format(result.stitches.rounded)} ${t('tools.knitting-gauge.results.castOnStitches')}`
  const rwCopySummary = `${nf.format(result.rows.rounded)} ${t('tools.knitting-gauge.results.rows')}`

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="dim-to-counts-width"
            className="block text-sm font-medium text-text mb-2"
          >
            {t('tools.knitting-gauge.fields.targetWidth')}
          </label>
          <input
            id="dim-to-counts-width"
            type="text"
            inputMode="decimal"
            value={widthDraft}
            onChange={handleWidthChange}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            placeholder="50"
          />
        </div>

        <div>
          <label
            htmlFor="dim-to-counts-length"
            className="block text-sm font-medium text-text mb-2"
          >
            {t('tools.knitting-gauge.fields.targetLength')}
          </label>
          <input
            id="dim-to-counts-length"
            type="text"
            inputMode="decimal"
            value={lengthDraft}
            onChange={handleLengthChange}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            placeholder="30"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard
          label={t('tools.knitting-gauge.results.castOnStitches')}
          result={result.stitches}
          unitLabel={unitLabel}
          copySummary={stCopySummary}
        />
        <ResultCard
          label={t('tools.knitting-gauge.results.rows')}
          result={result.rows}
          unitLabel={unitLabel}
          copySummary={rwCopySummary}
        />
      </div>
    </div>
  )
}
