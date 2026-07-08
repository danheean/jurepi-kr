/**
 * Pure helper — assemble a self-contained Markdown document from a content
 * entity so it can be copied to the clipboard (e.g. pasted into an LLM).
 *
 * Format (title + source + body):
 *
 *   # {title}
 *
 *   > {sourceLabel}: {sourceUrl}
 *
 *   {body markdown}
 *
 * The source blockquote is omitted when no `sourceUrl` is provided.
 */
export interface MarkdownDocumentParts {
  /** Entity title — rendered as the top-level H1. */
  title: string;
  /** Raw markdown body of the entity. */
  markdown: string;
  /** Absolute source URL. When omitted, the source line is dropped. */
  sourceUrl?: string;
  /** Localized label for the source line (e.g. "출처" / "Source"). */
  sourceLabel?: string;
}

const DEFAULT_SOURCE_LABEL = 'Source';

export function buildMarkdownDocument({
  title,
  markdown,
  sourceUrl,
  sourceLabel,
}: MarkdownDocumentParts): string {
  const heading = `# ${title.trim()}`;
  const body = markdown.trim();

  const blocks: string[] = [heading];

  if (sourceUrl) {
    const label = (sourceLabel ?? DEFAULT_SOURCE_LABEL).trim();
    blocks.push(`> ${label}: ${sourceUrl}`);
  }

  blocks.push(body);

  return blocks.join('\n\n');
}
