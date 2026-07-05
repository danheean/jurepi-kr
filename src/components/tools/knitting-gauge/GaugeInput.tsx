'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { Gauge } from '@/lib/knitting-gauge/schema'

interface GaugeInputProps {
  gauge: Gauge
  unit: 'cm' | 'inch'
  onGaugeChange: (next: Gauge) => void
  onUnitToggle: () => void
}

export function GaugeInput({
  gauge,
  unit,
  onGaugeChange,
  onUnitToggle,
}: GaugeInputProps) {
  const t = useTranslations()

  // Draft strings for each field
  const [stitchesDraft, setStitchesDraft] = useState(String(gauge.stitches))
  const [rowsDraft, setRowsDraft] = useState(String(gauge.rows))
  const [swatchWDraft, setSwatchWDraft] = useState(String(gauge.swatchW))
  const [swatchHDraft, setSwatchHDraft] = useState(String(gauge.swatchH))
  const [noteDraft, setNoteDraft] = useState(gauge.note || '')

  // External gauge changes (localStorage restore, project apply, unit toggle
  // conversion) must reflect in the inputs; the user's own in-progress draft
  // (which parses to the current prop) is left untouched.
  useEffect(() => {
    setStitchesDraft((d) => (parseFloat(d) === gauge.stitches ? d : String(gauge.stitches)))
    setRowsDraft((d) => (parseFloat(d) === gauge.rows ? d : String(gauge.rows)))
    setSwatchWDraft((d) => (parseFloat(d) === gauge.swatchW ? d : String(gauge.swatchW)))
    setSwatchHDraft((d) => (parseFloat(d) === gauge.swatchH ? d : String(gauge.swatchH)))
    setNoteDraft((d) => (d === (gauge.note || '') ? d : gauge.note || ''))
  }, [gauge.stitches, gauge.rows, gauge.swatchW, gauge.swatchH, gauge.note])

  const errors = useMemo(() => {
    const errs: Record<string, string> = {}

    const stitchesNum = parseFloat(stitchesDraft)
    if (stitchesDraft && (isNaN(stitchesNum) || stitchesNum <= 0)) {
      errs.stitches = t('tools.knitting-gauge.errors.invalidInput')
    }

    const rowsNum = parseFloat(rowsDraft)
    if (rowsDraft && (isNaN(rowsNum) || rowsNum <= 0)) {
      errs.rows = t('tools.knitting-gauge.errors.invalidInput')
    }

    const swatchWNum = parseFloat(swatchWDraft)
    if (swatchWDraft && (isNaN(swatchWNum) || swatchWNum <= 0)) {
      errs.swatchW = t('tools.knitting-gauge.errors.swatchTooSmall')
    }

    const swatchHNum = parseFloat(swatchHDraft)
    if (swatchHDraft && (isNaN(swatchHNum) || swatchHNum <= 0)) {
      errs.swatchH = t('tools.knitting-gauge.errors.swatchTooSmall')
    }

    return errs
  }, [stitchesDraft, rowsDraft, swatchWDraft, swatchHDraft, t])

  const handleStitchesChange = useCallback(
    (value: string) => {
      setStitchesDraft(value)
      const num = parseFloat(value)
      if (value && !isNaN(num) && num > 0) {
        onGaugeChange({
          ...gauge,
          stitches: num,
        })
      }
    },
    [gauge, onGaugeChange]
  )

  const handleRowsChange = useCallback(
    (value: string) => {
      setRowsDraft(value)
      const num = parseFloat(value)
      if (value && !isNaN(num) && num > 0) {
        onGaugeChange({
          ...gauge,
          rows: num,
        })
      }
    },
    [gauge, onGaugeChange]
  )

  const handleSwatchWChange = useCallback(
    (value: string) => {
      setSwatchWDraft(value)
      const num = parseFloat(value)
      if (value && !isNaN(num) && num > 0) {
        onGaugeChange({
          ...gauge,
          swatchW: num,
        })
      }
    },
    [gauge, onGaugeChange]
  )

  const handleSwatchHChange = useCallback(
    (value: string) => {
      setSwatchHDraft(value)
      const num = parseFloat(value)
      if (value && !isNaN(num) && num > 0) {
        onGaugeChange({
          ...gauge,
          swatchH: num,
        })
      }
    },
    [gauge, onGaugeChange]
  )

  const handleNoteChange = useCallback(
    (value: string) => {
      setNoteDraft(value)
      onGaugeChange({
        ...gauge,
        note: value || undefined,
      })
    },
    [gauge, onGaugeChange]
  )


  return (
    <fieldset className="space-y-4 rounded-lg border border-hairline bg-surface-muted p-6">
      <legend className="text-sm font-semibold text-text">
        {t('tools.knitting-gauge.fields.yourGauge')}
      </legend>

      {/* Stitches and Rows row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="stitches-input" className="block text-sm font-medium text-text">
            {t('tools.knitting-gauge.fields.stitches')}
          </label>
          <input
            id="stitches-input"
            type="text"
            inputMode="decimal"
            value={stitchesDraft}
            onChange={(e) => handleStitchesChange(e.target.value)}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              errors.stitches
                ? 'border-danger bg-danger/5 text-text'
                : 'border-hairline bg-surface text-text'
            }`}
            placeholder="22"
          />
          {errors.stitches && (
            <p className="mt-1 text-xs text-danger">{errors.stitches}</p>
          )}
        </div>

        <div>
          <label htmlFor="rows-input" className="block text-sm font-medium text-text">
            {t('tools.knitting-gauge.fields.rows')}
          </label>
          <input
            id="rows-input"
            type="text"
            inputMode="decimal"
            value={rowsDraft}
            onChange={(e) => handleRowsChange(e.target.value)}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              errors.rows
                ? 'border-danger bg-danger/5 text-text'
                : 'border-hairline bg-surface text-text'
            }`}
            placeholder="30"
          />
          {errors.rows && (
            <p className="mt-1 text-xs text-danger">{errors.rows}</p>
          )}
        </div>
      </div>

      {/* Swatch dimensions and unit toggle row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="swatch-w-input" className="block text-sm font-medium text-text">
            {t('tools.knitting-gauge.fields.swatchWidth')}
          </label>
          <input
            id="swatch-w-input"
            type="text"
            inputMode="decimal"
            value={swatchWDraft}
            onChange={(e) => handleSwatchWChange(e.target.value)}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              errors.swatchW
                ? 'border-danger bg-danger/5 text-text'
                : 'border-hairline bg-surface text-text'
            }`}
            placeholder={unit === 'cm' ? '10' : '4'}
          />
          {errors.swatchW && (
            <p className="mt-1 text-xs text-danger">{errors.swatchW}</p>
          )}
        </div>

        <div>
          <label htmlFor="swatch-h-input" className="block text-sm font-medium text-text">
            {t('tools.knitting-gauge.fields.swatchHeight')}
          </label>
          <input
            id="swatch-h-input"
            type="text"
            inputMode="decimal"
            value={swatchHDraft}
            onChange={(e) => handleSwatchHChange(e.target.value)}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              errors.swatchH
                ? 'border-danger bg-danger/5 text-text'
                : 'border-hairline bg-surface text-text'
            }`}
            placeholder={unit === 'cm' ? '10' : '4'}
          />
          {errors.swatchH && (
            <p className="mt-1 text-xs text-danger">{errors.swatchH}</p>
          )}
        </div>

        <div className="flex flex-col">
          <span className="mb-1 text-sm font-medium text-text">{t('tools.knitting-gauge.units.label')}</span>
          <div
            role="group"
            aria-label={t('tools.knitting-gauge.units.label')}
            className="flex overflow-hidden rounded-md border border-hairline"
          >
            <button
              type="button"
              onClick={() => unit !== 'cm' && onUnitToggle()}
              aria-pressed={unit === 'cm'}
              className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                unit === 'cm'
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface text-text hover:bg-surface-muted'
              }`}
            >
              {t('tools.knitting-gauge.units.cm')}
            </button>
            <button
              type="button"
              onClick={() => unit !== 'inch' && onUnitToggle()}
              aria-pressed={unit === 'inch'}
              className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                unit === 'inch'
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface text-text hover:bg-surface-muted'
              }`}
            >
              {t('tools.knitting-gauge.units.inch')}
            </button>
          </div>
        </div>
      </div>

      {/* Optional needle/yarn note */}
      <div>
        <label htmlFor="note-input" className="block text-sm font-medium text-text">
          {t('tools.knitting-gauge.fields.needle')}
        </label>
        <input
          id="note-input"
          type="text"
          value={noteDraft}
          onChange={(e) => handleNoteChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          placeholder={t('tools.knitting-gauge.fields.needle')}
        />
      </div>
    </fieldset>
  )
}
