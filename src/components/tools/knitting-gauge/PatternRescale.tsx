'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { CountResult } from '@/lib/knitting-gauge/gauge'
import { ResultCard } from './ResultCard'

interface PatternRescaleProps {
  patternGaugeStitches: number
  patternGaugeRows: number
  patternSwatchWidth: number
  patternSwatchHeight: number
  patternCount: number
  onPatternGaugeStitchesChange: (value: number) => void
  onPatternGaugeRowsChange: (value: number) => void
  onPatternSwatchWidthChange: (value: number) => void
  onPatternSwatchHeightChange: (value: number) => void
  onPatternCountChange: (value: number) => void
  result: {
    stitches: CountResult
    rows: CountResult
  }
  unitLabel: string
}

export function PatternRescale({
  patternGaugeStitches,
  patternGaugeRows,
  patternSwatchWidth,
  patternSwatchHeight,
  patternCount,
  onPatternGaugeStitchesChange,
  onPatternGaugeRowsChange,
  onPatternSwatchWidthChange,
  onPatternSwatchHeightChange,
  onPatternCountChange,
  result,
  unitLabel,
}: PatternRescaleProps) {
  const t = useTranslations()
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const [patternStDraft, setPatternStDraft] = useState(String(patternGaugeStitches))
  const [patternRwDraft, setPatternRwDraft] = useState(String(patternGaugeRows))
  const [patternSwDraft, setPatternSwDraft] = useState(String(patternSwatchWidth))
  const [patternShDraft, setPatternShDraft] = useState(String(patternSwatchHeight))
  const [patternCtDraft, setPatternCtDraft] = useState(String(patternCount))

  // Sync drafts when committed values change externally (e.g. unit toggle)
  useEffect(() => {
    setPatternStDraft((d) => (parseFloat(d) === patternGaugeStitches ? d : String(patternGaugeStitches)))
  }, [patternGaugeStitches])
  useEffect(() => {
    setPatternRwDraft((d) => (parseFloat(d) === patternGaugeRows ? d : String(patternGaugeRows)))
  }, [patternGaugeRows])
  useEffect(() => {
    setPatternSwDraft((d) => (parseFloat(d) === patternSwatchWidth ? d : String(patternSwatchWidth)))
  }, [patternSwatchWidth])
  useEffect(() => {
    setPatternShDraft((d) => (parseFloat(d) === patternSwatchHeight ? d : String(patternSwatchHeight)))
  }, [patternSwatchHeight])
  useEffect(() => {
    setPatternCtDraft((d) => (parseFloat(d) === patternCount ? d : String(patternCount)))
  }, [patternCount])

  const handlePatternStChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setPatternStDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onPatternGaugeStitchesChange(num)
    }
  }

  const handlePatternRwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setPatternRwDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onPatternGaugeRowsChange(num)
    }
  }

  const handlePatternSwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setPatternSwDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onPatternSwatchWidthChange(num)
    }
  }

  const handlePatternShChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setPatternShDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onPatternSwatchHeightChange(num)
    }
  }

  const handlePatternCtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setPatternCtDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onPatternCountChange(num)
    }
  }

  const stCopySummary = `${nf.format(result.stitches.rounded)} ${t('tools.knitting-gauge.results.castOnStitches')}`
  const rwCopySummary = `${nf.format(result.rows.rounded)} ${t('tools.knitting-gauge.results.rows')}`

  return (
    <div className="space-y-6">
      {/* Pattern Gauge */}
      <fieldset className="rounded-lg border border-hairline bg-surface-muted/50 p-4">
        <legend className="text-sm font-medium text-text px-2">
          {t('tools.knitting-gauge.fields.patternGauge')}
        </legend>
        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pattern-st"
              className="block text-sm font-medium text-text mb-2"
            >
              {t('tools.knitting-gauge.fields.stitches')}
            </label>
            <input
              id="pattern-st"
              type="text"
              inputMode="decimal"
              value={patternStDraft}
              onChange={handlePatternStChange}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              placeholder="20"
            />
          </div>

          <div>
            <label
              htmlFor="pattern-rw"
              className="block text-sm font-medium text-text mb-2"
            >
              {t('tools.knitting-gauge.fields.rows')}
            </label>
            <input
              id="pattern-rw"
              type="text"
              inputMode="decimal"
              value={patternRwDraft}
              onChange={handlePatternRwChange}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              placeholder="30"
            />
          </div>

          <div>
            <label
              htmlFor="pattern-sw"
              className="block text-sm font-medium text-text mb-2"
            >
              {t('tools.knitting-gauge.fields.swatchWidth')}
            </label>
            <input
              id="pattern-sw"
              type="text"
              inputMode="decimal"
              value={patternSwDraft}
              onChange={handlePatternSwChange}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              placeholder="10"
            />
          </div>

          <div>
            <label
              htmlFor="pattern-sh"
              className="block text-sm font-medium text-text mb-2"
            >
              {t('tools.knitting-gauge.fields.swatchHeight')}
            </label>
            <input
              id="pattern-sh"
              type="text"
              inputMode="decimal"
              value={patternShDraft}
              onChange={handlePatternShChange}
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              placeholder="10"
            />
          </div>
        </div>
      </fieldset>

      {/* Pattern Count */}
      <div>
        <label
          htmlFor="pattern-count"
          className="block text-sm font-medium text-text mb-2"
        >
          {t('tools.knitting-gauge.fields.patternCount')}
        </label>
        <input
          id="pattern-count"
          type="text"
          inputMode="decimal"
          value={patternCtDraft}
          onChange={handlePatternCtChange}
          className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          placeholder="100"
        />
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
