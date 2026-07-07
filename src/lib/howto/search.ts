import type { MergedGuide } from './schema';

function normalize(str: string): string {
  return str
    .trim()
    .toLocaleLowerCase('ko')
    .normalize('NFC')
    .replace(/[ñáéíóú]/gi, 'a');
}

export function filterGuides(
  guides: MergedGuide[],
  query: string,
  locale: 'ko' | 'en' = 'ko'
): MergedGuide[] {
  if (!query.trim()) {
    return guides;
  }

  const normalized = normalize(query);

  return guides.filter((guide) => {
    const koTitle = normalize(guide.ko.title);
    const koSummary = normalize(guide.ko.summary);
    const enTitle = normalize(guide.en.title);
    const enSummary = normalize(guide.en.summary);
    const tags = guide.tags.map(normalize);
    const topic = normalize(guide.topic);

    return (
      koTitle.includes(normalized) ||
      koSummary.includes(normalized) ||
      enTitle.includes(normalized) ||
      enSummary.includes(normalized) ||
      tags.some((t) => t.includes(normalized)) ||
      topic.includes(normalized)
    );
  });
}
