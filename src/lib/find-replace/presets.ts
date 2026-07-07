import type { Preset, Rule } from './schema';

/**
 * Curated preset rule-sets and built-in transforms.
 * These are displayed in the UI for one-click application.
 *
 * INVARIANT (tested):
 * - Each ruleset preset applies without error on its sample text
 * - Each builtin transform round-trips where applicable
 */
export const PRESETS: Preset[] = [
  // Built-in transforms (no rules, single-step operations)
  {
    id: 'to-js-string',
    labelKey: 'preset.toJsString',
    kind: 'builtin',
    transform: 'to-js-string',
    sampleKey: 'preset.toJsStringSample',
  },
  {
    id: 'from-js-string',
    labelKey: 'preset.fromJsString',
    kind: 'builtin',
    transform: 'from-js-string',
  },
  {
    id: 'normalize-quotes',
    labelKey: 'preset.normalizeQuotes',
    kind: 'builtin',
    transform: 'normalize-quotes',
  },
  {
    id: 'fullwidth-to-halfwidth',
    labelKey: 'preset.fullwidthToHalfwidth',
    kind: 'builtin',
    transform: 'fullwidth-to-halfwidth',
  },
  {
    id: 'strip-blank-lines',
    labelKey: 'preset.stripBlankLines',
    kind: 'builtin',
    transform: 'strip-blank-lines',
  },
  {
    id: 'collapse-spaces',
    labelKey: 'preset.collapseSpaces',
    kind: 'builtin',
    transform: 'collapse-spaces',
  },
  {
    id: 'strip-line-numbers',
    labelKey: 'preset.stripLineNumbers',
    kind: 'builtin',
    transform: 'strip-line-numbers',
  },
  {
    id: 'lines-to-array-items',
    labelKey: 'preset.linesToArrayItems',
    kind: 'builtin',
    transform: 'lines-to-array-items',
  },

  // Ruleset presets (visible, editable rules)
  {
    id: 'trim-spaces',
    labelKey: 'preset.trimSpaces',
    kind: 'ruleset',
    rules: [
      {
        id: 'trim-1',
        find: '^ +',
        replace: '',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
        flags: 'm',
      },
      {
        id: 'trim-2',
        find: ' +$',
        replace: '',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
        flags: 'm',
      },
    ],
  },

  {
    id: 'url-to-markdown-link',
    labelKey: 'preset.urlToMarkdownLink',
    kind: 'ruleset',
    rules: [
      {
        id: 'url-1',
        find: '(https?://[^\\s]+)',
        replace: '[$1]($1)',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      },
    ],
  },
];
