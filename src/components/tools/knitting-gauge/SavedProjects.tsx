'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Gauge } from '@/lib/knitting-gauge/schema'

interface SavedProjectsProps {
  projects: Array<{ name: string; gauge: Gauge }>
  onSave: (name: string) => void
  onApply: (name: string) => void
  onRemove: (name: string) => void
}

export function SavedProjects({
  projects,
  onSave,
  onApply,
  onRemove,
}: SavedProjectsProps) {
  const t = useTranslations()
  const [inputValue, setInputValue] = useState('')

  const handleSaveClick = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick()
    }
  }

  const isFull = projects.length >= 50

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-text">
        {t('tools.knitting-gauge.projects.title')}
      </h2>

      {/* Save input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('tools.knitting-gauge.projects.placeholder')}
          disabled={isFull}
          className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:bg-surface-muted disabled:text-text-muted"
        />
        <button
          onClick={handleSaveClick}
          disabled={isFull || !inputValue.trim()}
          className="min-h-[44px] rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand/90 active:bg-brand/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:bg-surface-muted/50 disabled:text-text-muted"
        >
          {t('tools.knitting-gauge.actions.save')}
        </button>
      </div>

      {/* Max message */}
      {isFull && (
        <p className="text-sm text-text-muted">
          {t('tools.knitting-gauge.projects.max')}
        </p>
      )}

      {/* Projects list */}
      <div className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t('tools.knitting-gauge.projects.empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li
                key={project.name}
                className="flex items-center justify-between rounded-md border border-hairline bg-surface-muted/50 px-4 py-3"
              >
                <span className="text-sm font-medium text-text">
                  {project.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApply(project.name)}
                    className="min-h-[44px] min-w-[44px] rounded-md border border-hairline bg-surface-muted px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted/80 active:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {t('tools.knitting-gauge.actions.apply')}
                  </button>
                  <button
                    onClick={() => onRemove(project.name)}
                    className="min-h-[44px] min-w-[44px] rounded-md border border-hairline bg-surface-muted px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted/80 active:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {t('tools.knitting-gauge.actions.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
