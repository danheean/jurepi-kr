'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useKnittingGauge } from './useKnittingGauge'
import { GaugeInput } from './GaugeInput'
import { ModeTabs } from './ModeTabs'
import { DimToCounts } from './DimToCounts'
import { CountsToDim } from './CountsToDim'
import { PatternRescale } from './PatternRescale'
import { SavedProjects } from './SavedProjects'

/**
 * KnittingGauge Orchestrator
 * Manages the complete knitting gauge calculator state and layout.
 * Owns useKnittingGauge() hook and wires all child components.
 */
export function KnittingGauge() {
  const t = useTranslations()
  const locale = useLocale()
  const hook = useKnittingGauge()

  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const unitLabel =
    hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')

  // One persistent live region announces the active mode's result
  // (WCAG 2.1 SC 4.1.3); panels unmount on mode switch, so the
  // orchestrator owns it to keep the region mounted.
  const announcement =
    hook.mode === 'dimToCounts'
      ? `${t('tools.knitting-gauge.results.castOnStitches')} ${nf.format(hook.dimToCountsResult.stitches.rounded)}, ${t('tools.knitting-gauge.results.rows')} ${nf.format(hook.dimToCountsResult.rows.rounded)}`
      : hook.mode === 'countsToDim'
        ? `${t('tools.knitting-gauge.fields.width')} ${nf.format(hook.countsToDimResult.width)}${unitLabel}, ${t('tools.knitting-gauge.fields.length')} ${nf.format(hook.countsToDimResult.length)}${unitLabel}`
        : `${t('tools.knitting-gauge.results.rescaledCount')} ${nf.format(hook.patternRescaleResult.stitches.rounded)}`

  return (
    <div className="space-y-6">
      {/* Gauge input section */}
      <GaugeInput
        gauge={hook.gauge}
        unit={hook.unit}
        onGaugeChange={hook.setGauge}
        onUnitToggle={hook.handleUnitToggle}
      />

      {/* Mode tabs */}
      <ModeTabs mode={hook.mode} onModeChange={hook.setMode} />

      {/* Mode-specific panels — tabpanel ties the active tab to its controls.
          No tabIndex: the first form control inside is the natural stop. */}
      <div
        key={hook.mode}
        id="kg-tabpanel"
        role="tabpanel"
        aria-labelledby={`kg-tab-${hook.mode}`}
        className="panel-fade-in"
      >
      {hook.mode === 'dimToCounts' && (
        <DimToCounts
          targetWidth={hook.targetWidth}
          targetLength={hook.targetLength}
          onTargetWidthChange={hook.setTargetWidth}
          onTargetLengthChange={hook.setTargetLength}
          result={hook.dimToCountsResult}
          unitLabel={
            hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')
          }
        />
      )}

      {hook.mode === 'countsToDim' && (
        <CountsToDim
          stitchCount={hook.stitchCount}
          rowCount={hook.rowCount}
          onStitchCountChange={hook.setStitchCount}
          onRowCountChange={hook.setRowCount}
          result={hook.countsToDimResult}
          unitLabel={
            hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')
          }
        />
      )}

      {hook.mode === 'patternRescale' && (
        <PatternRescale
          patternGaugeStitches={hook.patternGaugeStitches}
          patternGaugeRows={hook.patternGaugeRows}
          patternSwatchWidth={hook.patternSwatchWidth}
          patternSwatchHeight={hook.patternSwatchHeight}
          patternCount={hook.patternCount}
          onPatternGaugeStitchesChange={hook.setPatternGaugeStitches}
          onPatternGaugeRowsChange={hook.setPatternGaugeRows}
          onPatternSwatchWidthChange={hook.setPatternSwatchWidth}
          onPatternSwatchHeightChange={hook.setPatternSwatchHeight}
          onPatternCountChange={hook.setPatternCount}
          result={hook.patternRescaleResult}
          unitLabel={
            hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')
          }
        />
      )}
      </div>

      {/* Persistent result announcement for screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Saved projects section */}
      <SavedProjects
        projects={hook.projects}
        onSave={hook.handleSaveProject}
        onApply={hook.handleApplyProject}
        onRemove={hook.handleRemoveProject}
      />
    </div>
  )
}
