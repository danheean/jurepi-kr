/**
 * Regular expression syntax cheatsheet.
 * Documentation only—provides i18n keys for UI display.
 */

export interface CheatsheetItem {
  token: string; // The regex syntax token (e.g., "^", "\d", "(?=...)")
  descriptionKey: string; // i18n key for the description
}

export interface CheatsheetSection {
  section: string; // Section title (e.g., "anchors", "quantifiers")
  items: CheatsheetItem[];
}

export const CHEATSHEET: CheatsheetSection[] = [
  {
    section: 'anchors',
    items: [
      { token: '^', descriptionKey: 'cheatsheet.caret' },
      { token: '$', descriptionKey: 'cheatsheet.dollar' },
      { token: '\\b', descriptionKey: 'cheatsheet.wordBoundary' },
      { token: '\\B', descriptionKey: 'cheatsheet.nonWordBoundary' },
    ],
  },
  {
    section: 'quantifiers',
    items: [
      { token: '*', descriptionKey: 'cheatsheet.star' },
      { token: '+', descriptionKey: 'cheatsheet.plus' },
      { token: '?', descriptionKey: 'cheatsheet.question' },
      { token: '{n}', descriptionKey: 'cheatsheet.exactCount' },
      { token: '{n,m}', descriptionKey: 'cheatsheet.rangeCount' },
    ],
  },
  {
    section: 'character-classes',
    items: [
      { token: '.', descriptionKey: 'cheatsheet.dot' },
      { token: '\\d', descriptionKey: 'cheatsheet.digit' },
      { token: '\\D', descriptionKey: 'cheatsheet.nonDigit' },
      { token: '\\w', descriptionKey: 'cheatsheet.word' },
      { token: '\\W', descriptionKey: 'cheatsheet.nonWord' },
      { token: '\\s', descriptionKey: 'cheatsheet.whitespace' },
      { token: '\\S', descriptionKey: 'cheatsheet.nonWhitespace' },
      { token: '[abc]', descriptionKey: 'cheatsheet.charSet' },
      { token: '[^abc]', descriptionKey: 'cheatsheet.negatedCharSet' },
    ],
  },
  {
    section: 'groups',
    items: [
      { token: '()', descriptionKey: 'cheatsheet.group' },
      { token: '(?:...)', descriptionKey: 'cheatsheet.nonCapturingGroup' },
      { token: '(?<name>...)', descriptionKey: 'cheatsheet.namedGroup' },
      { token: '|', descriptionKey: 'cheatsheet.alternation' },
    ],
  },
  {
    section: 'lookaround',
    items: [
      { token: '(?=...)', descriptionKey: 'cheatsheet.lookahead' },
      { token: '(?!...)', descriptionKey: 'cheatsheet.negativeLookahead' },
      { token: '(?<=...)', descriptionKey: 'cheatsheet.lookbehind' },
      { token: '(?<!...)', descriptionKey: 'cheatsheet.negativeLookbehind' },
    ],
  },
  {
    section: 'flags',
    items: [
      { token: 'i', descriptionKey: 'cheatsheet.caseInsensitive' },
      { token: 'm', descriptionKey: 'cheatsheet.multiline' },
      { token: 's', descriptionKey: 'cheatsheet.dotAll' },
      { token: 'u', descriptionKey: 'cheatsheet.unicode' },
      { token: 'y', descriptionKey: 'cheatsheet.sticky' },
    ],
  },
  {
    section: 'replacements',
    items: [
      { token: '$1, $2, ...', descriptionKey: 'cheatsheet.captureGroup' },
      { token: '$<name>', descriptionKey: 'cheatsheet.namedCaptureGroup' },
      { token: '$&', descriptionKey: 'cheatsheet.fullMatch' },
      { token: '$$', descriptionKey: 'cheatsheet.literalDollar' },
    ],
  },
];
