/**
 * Age calculation logic (pure).
 * Returns an object with type and value for display.
 *
 * Display logic ("만 N세" / "향년 N세") belongs to the UI layer (i18n).
 * This layer returns structured data only.
 */

export interface Age {
  type: 'age' | 'ageAtDeath';
  value: number;
}

/**
 * Calculate age based on birthYear and deathYear.
 *
 * - If birthYear absent: return undefined (no age info).
 * - If alive (deathYear absent): return { type: 'age', value: currentYear - birthYear }.
 * - If dead (deathYear present): return { type: 'ageAtDeath', value: deathYear - birthYear }.
 *
 * currentYear defaults to new Date().getFullYear().
 */
export function calculateAge(
  birthYear: number | undefined,
  deathYear: number | undefined,
  currentYear: number = new Date().getFullYear()
): Age | undefined {
  if (!birthYear) {
    return undefined;
  }

  if (deathYear) {
    // Person is deceased
    return {
      type: 'ageAtDeath',
      value: deathYear - birthYear,
    };
  }

  // Person is alive
  return {
    type: 'age',
    value: currentYear - birthYear,
  };
}
