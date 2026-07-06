'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Option } from '@/lib/roulette/schema';
import { MAX_OPTIONS, MIN_WEIGHT, MAX_WEIGHT } from '@/lib/roulette/schema';

export interface OptionListProps {
  options: Option[];
  onAdd: (label: string, weight: number) => void;
  onUpdate: (index: number, label: string, weight: number) => void;
  onRemove: (index: number) => void;
  onReorderUp?: (index: number) => void;
  onReorderDown?: (index: number) => void;
  maxReached?: boolean;
}

export function OptionList({
  options,
  onAdd,
  onUpdate,
  onRemove,
  onReorderUp,
  onReorderDown,
  maxReached,
}: OptionListProps) {
  const t = useTranslations('tools.roulette');

  const [addLabel, setAddLabel] = useState('');
  const [addWeight, setAddWeight] = useState('1');
  const addInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = () => {
    const weight = parseInt(addWeight, 10) || 1;
    onAdd(addLabel, weight);
    setAddLabel('');
    setAddWeight('1');
    addInputRef.current?.focus();
  };

  // 콤마/줄바꿈이 포함된 목록 붙여넣기 → 즉시 일괄 추가
  // (text input은 붙여넣기 시 줄바꿈을 버리므로 기본 동작 전에 가로챈다)
  const handleAddPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!/[,\r\n]/.test(text)) return; // 단일 라벨은 기본 붙여넣기 유지
    e.preventDefault();
    const weight = parseInt(addWeight, 10) || 1;
    onAdd(text, weight);
    setAddLabel('');
    addInputRef.current?.focus();
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // 한글 IME 조합 확정 Enter(isComposing)는 실제 Enter와 연달아 발화해
      // 옵션이 중복 추가된다 — 조합 중 이벤트는 무시 (keyCode 229 = 구형 브라우저)
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      handleAddClick();
    } else if (e.key === 'Backspace' && !addLabel) {
      setAddLabel('');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-card-title font-bold text-text">
        {t('options.label')}
      </h2>

      {/* Add option row */}
      <div className="flex gap-2">
        <input
          ref={addInputRef}
          type="text"
          value={addLabel}
          onChange={(e) => setAddLabel(e.target.value)}
          onKeyDown={handleAddKeyDown}
          onPaste={handleAddPaste}
          data-testid="roulette-add-input"
          placeholder={t('options.placeholder')}
          disabled={maxReached}
          className="flex-1 px-3 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-rose disabled:opacity-50"
          aria-label={t('options.label')}
        />
        <input
          type="number"
          value={addWeight}
          onChange={(e) => setAddWeight(e.target.value)}
          min={MIN_WEIGHT}
          max={MAX_WEIGHT}
          data-testid="roulette-add-weight"
          disabled={maxReached}
          className="w-16 px-2 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-rose disabled:opacity-50"
          aria-label={t('options.weight')}
        />
        <button
          onClick={handleAddClick}
          data-testid="roulette-add-button"
          disabled={!addLabel.trim() || maxReached}
          className="px-4 py-2 bg-brand text-on-brand rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105 transition-transform"
        >
          {t('options.add')}
        </button>
      </div>

      {maxReached && (
        <p className="text-sm text-danger">
          {t('options.tooMany')}
        </p>
      )}

      {/* Option rows */}
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex gap-2 items-center p-2 rounded-lg border border-hairline hover:shadow-sm transition-shadow">
            {/* Drag handle (six dots) */}
            <div className="text-text-secondary cursor-grab active:cursor-grabbing">
              ⋮⋮
            </div>

            {/* Label */}
            <input
              type="text"
              value={opt.label}
              onChange={(e) => onUpdate(idx, e.target.value, opt.weight)}
              placeholder={`${t('options.placeholder')}`}
              maxLength={50}
              className="flex-1 px-3 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-rose"
              aria-label={`${t('options.label')} ${idx + 1}`}
            />

            {/* Weight */}
            <input
              type="number"
              value={opt.weight}
              onChange={(e) => onUpdate(idx, opt.label, parseInt(e.target.value, 10) || 1)}
              min={MIN_WEIGHT}
              max={MAX_WEIGHT}
              className="w-16 px-2 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-rose"
              aria-label={`${t('options.weight')} ${idx + 1}`}
            />

            {/* Reorder buttons */}
            <button
              onClick={() => onReorderUp?.(idx)}
              disabled={idx === 0}
              className="px-2 py-2 text-text-muted hover:enabled:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('options.reorderUp')}
            >
              ↑
            </button>
            <button
              onClick={() => onReorderDown?.(idx)}
              disabled={idx === options.length - 1}
              className="px-2 py-2 text-text-muted hover:enabled:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('options.reorderDown')}
            >
              ↓
            </button>

            {/* Delete button */}
            <button
              onClick={() => onRemove(idx)}
              className="px-3 py-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded-lg transition-colors"
              aria-label={`${t('options.delete')} ${idx + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {options.length === 0 && (
        <p className="text-sm text-text-secondary italic">{t('options.empty')}</p>
      )}
    </div>
  );
}
