'use client';

interface OptionItem<T extends string> {
  value: T;
  /** Primary label — becomes the radio's accessible name. */
  label: string;
  /** Optional secondary hint (e.g. charset), shown muted and decorative. */
  hint?: string;
}

interface OptionGroupProps<T extends string> {
  /** Fieldset legend text. */
  legend: string;
  /** Radio group `name` — one checked option per group. */
  name: string;
  value: T;
  options: readonly OptionItem<T>[];
  onChange: (value: T) => void;
  /**
   * `inline` wraps short options in a row (mode/direction); `stack` lists
   * full-width rows so long labels (variant charset) read on their own line.
   */
  layout?: 'inline' | 'stack';
}

/**
 * OptionGroup: accessible single-select control shared by the mode/variant/
 * direction toggles. Keeps native radio semantics (real `<input type=radio>`
 * per option, group by `name`) so keyboard + tests stay intact, while drawing a
 * clearly-designed selected state — selection reads at a glance instead of
 * relying on the low-contrast native radio dot.
 */
export function OptionGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  layout = 'inline',
}: OptionGroupProps<T>) {
  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold text-text">{legend}</legend>
      <div className={layout === 'stack' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={[
                'flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                layout === 'stack' ? 'w-full' : '',
                selected
                  ? 'border-brand bg-brand-soft'
                  : 'border-hairline bg-surface hover:border-hairline-strong hover:bg-surface-muted',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                aria-label={option.label}
                className={[
                  'mt-0.5 h-[18px] w-[18px] shrink-0 appearance-none rounded-full border-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  selected ? 'border-brand bg-brand' : 'border-hairline-strong bg-surface',
                ].join(' ')}
              />
              <span className="min-w-0">
                <span
                  className={[
                    'block text-sm',
                    selected ? 'font-semibold text-brand-ink' : 'font-medium text-text',
                  ].join(' ')}
                >
                  {option.label}
                </span>
                {option.hint && (
                  <span className="mt-0.5 block font-mono text-xs text-text-secondary">
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
