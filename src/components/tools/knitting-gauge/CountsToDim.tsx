'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'

interface CountsToDimProps {
  stitchCount: number
  rowCount: number
  onStitchCountChange: (value: number) => void
  onRowCountChange: (value: number) => void
  result: {
    width: number
    length: number
  }
  unitLabel: string
}

export function CountsToDim({
  stitchCount,
  rowCount,
  onStitchCountChange,
  onRowCountChange,
  result,
  unitLabel,
}: CountsToDimProps) {
  const t = useTranslations()
  const locale = useLocale()
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const [stitchDraft, setStitchDraft] = useState(String(stitchCount))
  const [rowDraft, setRowDraft] = useState(String(rowCount))

  // Sync drafts when the committed value changes externally
  useEffect(() => {
    setStitchDraft((d) => (parseFloat(d) === stitchCount ? d : String(stitchCount)))
  }, [stitchCount])
  useEffect(() => {
    setRowDraft((d) => (parseFloat(d) === rowCount ? d : String(rowCount)))
  }, [rowCount])

  const handleStitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setStitchDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onStitchCountChange(num)
    }
  }

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const draft = e.target.value
    setRowDraft(draft)
    const num = parseFloat(draft)
    if (!isNaN(num) && num > 0) {
      onRowCountChange(num)
    }
  }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="counts-to-dim-stitch"
            className="block text-sm font-medium text-text mb-2"
          >
            {t('tools.knitting-gauge.fields.stitchCount')}
          </label>
          <input
            id="counts-to-dim-stitch"
            type="text"
            inputMode="decimal"
            value={stitchDraft}
            onChange={handleStitchChange}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            placeholder="110"
          />
        </div>

        <div>
          <label
            htmlFor="counts-to-dim-row"
            className="block text-sm font-medium text-text mb-2"
          >
            {t('tools.knitting-gauge.fields.rowCount')}
          </label>
          <input
            id="counts-to-dim-row"
            type="text"
            inputMode="decimal"
            value={rowDraft}
            onChange={handleRowChange}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            placeholder="90"
          />
        </div>
      </div>

      {/* Results */}
      <div className="rounded-lg border border-hairline bg-surface p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">
            {t('tools.knitting-gauge.fields.width')}
          </p>
          <p
            className="text-3xl font-bold"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {nf.format(result.width)} {unitLabel}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">
            {t('tools.knitting-gauge.fields.length')}
          </p>
          <p
            className="text-3xl font-bold"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {nf.format(result.length)} {unitLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
