import type { MergedGuide } from './schema';

const READING_WPM = 200;

export const TOPIC_ORDER = ['setup', 'ai-tools', 'git', 'api', 'cli', 'deploy'] as const;

export function allGuides(catalog: MergedGuide[]): MergedGuide[] {
  return catalog;
}

export function byId(catalog: MergedGuide[], slug: string): MergedGuide | undefined {
  return catalog.find((g) => g.slug === slug);
}

export function byTopic(catalog: MergedGuide[], topic: string): MergedGuide[] {
  return catalog.filter((g) => g.topic === topic);
}

export function topics(catalog: MergedGuide[]): string[] {
  const catalogTopics = new Set(catalog.map((g) => g.topic));
  return TOPIC_ORDER.filter((t) => catalogTopics.has(t));
}

export function readingTime(body: string): number {
  const trimmed = body.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / READING_WPM));
}
