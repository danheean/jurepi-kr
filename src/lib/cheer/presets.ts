/**
 * Preset phrase structure — id and situation, without labels.
 * Labels are resolved via i18n at render time (tools.cheer.presets.<situation>.<id>).
 */
export interface PresetPhrase {
  id: string; // stable id, e.g. 'cheer', 'encore'
  situation: 'concert' | 'sports' | 'birthday' | 'event';
}

/**
 * Curated preset cheer phrases grouped by situation.
 * All phrase labels come from i18n, NOT from this constant.
 */
export const PRESET_PHRASES: PresetPhrase[] = [
  // CONCERT (~6 presets)
  { id: 'cheer', situation: 'concert' },
  { id: 'encore', situation: 'concert' },
  { id: 'love-you', situation: 'concert' },
  { id: 'forever-fan', situation: 'concert' },
  { id: 'best-concert', situation: 'concert' },
  { id: 'comeback', situation: 'concert' },

  // SPORTS (~6 presets)
  { id: 'win', situation: 'sports' },
  { id: 'one-more-goal', situation: 'sports' },
  { id: 'fighting-spirit', situation: 'sports' },
  { id: 'go-team', situation: 'sports' },
  { id: 'defense', situation: 'sports' },
  { id: 'golden-chance', situation: 'sports' },

  // BIRTHDAY (~6 presets)
  { id: 'happy-birthday', situation: 'birthday' },
  { id: 'many-happy-returns', situation: 'birthday' },
  { id: 'wish-come-true', situation: 'birthday' },
  { id: 'make-wish', situation: 'birthday' },
  { id: 'special-day', situation: 'birthday' },
  { id: 'all-the-best', situation: 'birthday' },

  // EVENT (~6 presets)
  { id: 'let-go', situation: 'event' },
  { id: 'lets-do-it', situation: 'event' },
  { id: 'great-time', situation: 'event' },
  { id: 'good-luck', situation: 'event' },
  { id: 'have-fun', situation: 'event' },
  { id: 'full-energy', situation: 'event' },
];

/**
 * Get all preset phrases for a specific situation.
 * @param situation - 'concert' | 'sports' | 'birthday' | 'event'
 * @returns array of presets matching the situation
 */
export function getPresetsByCategory(
  situation: PresetPhrase['situation']
): PresetPhrase[] {
  return PRESET_PHRASES.filter((p) => p.situation === situation);
}
