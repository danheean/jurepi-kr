/**
 * Transform registry ToolMeta entries into localized SearchableTool array.
 * Pure function: no React/Next imports, immutable output.
 */

import type { SearchableTool } from '@/lib/tool-search';
import { isNewTool, NEW_BADGE_MAX_COUNT } from '@/lib/tool-search';
import type { ToolMeta } from '@/tools/types';

/**
 * Translator function signature: (key: string) => string
 * Typically: (await getTranslations()).
 */
export type Translator = (key: string) => string;

/**
 * Build date injected at build time via next.config `env` — identical in the
 * server (SSG) and client bundles, so the NEW badge never causes a hydration
 * mismatch. Undefined (e.g. bare vitest) → no tool is marked new.
 */
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE;

/**
 * Convert registry tools to searchable tools with localized name and description.
 * `isNew` marks the {@link NEW_BADGE_MAX_COUNT} most-recently-added tools that are
 * still inside the NEW window (a launch burst can't flood the grid with badges).
 * Returns a new immutable array.
 *
 * @param tools Registry items from @/tools/registry
 * @param t Translator function (typically from getTranslations())
 * @param referenceDate ISO date the "new" window is measured against (defaults to build date)
 * @returns New SearchableTool[] with localized metadata
 */
export function toSearchableTools(
  tools: readonly ToolMeta[],
  t: Translator,
  referenceDate: string | undefined = BUILD_DATE
): SearchableTool[] {
  // Among window-eligible tools, keep only the newest few. Deterministic order
  // (addedAt desc, id asc tiebreak) so server (SSG) and client agree — no
  // hydration mismatch on the badge.
  const newIds = new Set(
    tools
      .filter((tool) => isNewTool(tool.addedAt, referenceDate))
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.id.localeCompare(b.id))
      .slice(0, NEW_BADGE_MAX_COUNT)
      .map((tool) => tool.id)
  );

  return tools.map((tool) => ({
    ...tool,
    isNew: newIds.has(tool.id),
    name: t(`tools.${tool.id}.title`),
    description: t(`tools.${tool.id}.description`),
  }));
}
