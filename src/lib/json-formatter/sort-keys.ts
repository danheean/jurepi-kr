/**
 * Recursively sort object keys alphabetically
 * Immutable: returns new object/array, never mutates input
 * Arrays maintain their order; objects' keys are alphabetized
 */
export function sortKeysRecursive(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeysRecursive);
  }

  // Object: sort keys alphabetically
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortKeysRecursive(obj[key]);
  }

  return sorted;
}
