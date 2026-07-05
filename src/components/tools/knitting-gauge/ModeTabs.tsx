'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Mode } from '@/lib/knitting-gauge/schema'

interface ModeTabsProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

const MODES: Array<{ id: Mode; labelKey: string }> = [
  { id: 'dimToCounts', labelKey: 'tools.knitting-gauge.modes.dimToCounts' },
  { id: 'countsToDim', labelKey: 'tools.knitting-gauge.modes.countsToDim' },
  { id: 'patternRescale', labelKey: 'tools.knitting-gauge.modes.patternRescale' },
]

/**
 * ModeTabs: 3 mode tabs with roving tabindex (WAI-ARIA tabs pattern).
 * ArrowLeft/Right moves focus AND selection; only the focused tab is a
 * tab stop. Panels are tied via aria-controls → #kg-tabpanel.
 */
export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  const t = useTranslations()
  const [focusedIndex, setFocusedIndex] = useState(
    Math.max(0, MODES.findIndex((m) => m.id === mode))
  )
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const moveTo = (index: number) => {
    setFocusedIndex(index)
    onModeChange(MODES[index].id)
    tabRefs.current[index]?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveTo(focusedIndex === 0 ? MODES.length - 1 : focusedIndex - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveTo((focusedIndex + 1) % MODES.length)
    }
  }

  return (
    <div
      role="tablist"
      aria-label={t('tools.knitting-gauge.modes.label')}
      className="flex gap-1 border-b border-hairline overflow-x-auto scroll-smooth"
    >
      {MODES.map((m, idx) => (
        <button
          key={m.id}
          ref={(el) => {
            tabRefs.current[idx] = el
          }}
          id={`kg-tab-${m.id}`}
          role="tab"
          aria-selected={mode === m.id}
          aria-controls="kg-tabpanel"
          tabIndex={focusedIndex === idx ? 0 : -1}
          onClick={() => {
            setFocusedIndex(idx)
            onModeChange(m.id)
          }}
          onFocus={() => setFocusedIndex(idx)}
          onKeyDown={handleKeyDown}
          className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            mode === m.id
              ? 'text-text'
              : 'text-text-secondary hover:text-text/80'
          }`}
        >
          {t(m.labelKey)}
          {mode === m.id && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-accent-sun" />
          )}
        </button>
      ))}
    </div>
  )
}
