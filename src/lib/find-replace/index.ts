/**
 * Public barrel for the find-replace domain layer (pure, no React/Next/DOM).
 * UI/hook consumers import from '@/lib/find-replace'.
 */
export * from './schema';
export { escapeRegExp, escapeReplacement } from './escape';
export { compile, compileForValidation } from './compile';
export { applyRule } from './rule';
export { applyRules } from './apply';
export { PRESETS } from './presets';
export {
  toJsString,
  fromJsString,
  normalizeQuotes,
  fullwidthToHalfwidth,
  stripBlankLines,
  collapseSpaces,
  stripLineNumbers,
  linesToArrayItems,
  applyTransform,
} from './transforms';
export { CHEATSHEET } from './cheatsheet';
export type { CheatsheetItem, CheatsheetSection } from './cheatsheet';
// Note: parseStore/serializeStore are the canonical store (de)serializers (from schema).
// recents.ts re-implements serializeStore; the barrel exposes the schema versions to
// avoid an ambiguous duplicate. deserializeStore (recents-only) is re-exported here.
export {
  pushRecent,
  saveSet,
  removeSet,
  pruneInvalid,
  deserializeStore,
} from './recents';
