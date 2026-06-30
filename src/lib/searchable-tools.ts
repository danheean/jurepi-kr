/**
 * Transform registry ToolMeta entries into localized SearchableTool array.
 * Pure function: no React/Next imports, immutable output.
 */

import type { SearchableTool } from '@/lib/tool-search';
import type { ToolMeta } from '@/tools/types';

/**
 * Translator function signature: (key: string) => string
 * Typically: (await getTranslations()).
 */
export type Translator = (key: string) => string;

/**
 * Convert registry tools to searchable tools with localized name and description.
 * Returns a new immutable array.
 *
 * @param tools Registry items from @/tools/registry
 * @param t Translator function (typically from getTranslations())
 * @returns New SearchableTool[] with localized metadata
 */
export function toSearchableTools(
  tools: readonly ToolMeta[],
  t: Translator
): SearchableTool[] {
  return tools.map((tool) => ({
    ...tool,
    name: t(`tools.${tool.id}.title`),
    description: t(`tools.${tool.id}.description`),
  }));
}
