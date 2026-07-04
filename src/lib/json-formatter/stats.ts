/**
 * JSON statistics (size, element count, depth)
 */
export interface JsonStats {
  byteSize: number; // UTF-8 byte length of formatted JSON
  elementCount: number; // count of leaf values (non-container nodes)
  depth: number; // maximum nesting depth
}

/**
 * Calculate statistics for JSON object
 */
export function getStats(json: any): JsonStats {
  // Format to get byte size
  const formatted = JSON.stringify(json, null, 2);
  const byteSize = new TextEncoder().encode(formatted).length;

  // Count elements (leaf values)
  const elementCount = countElements(json);

  // Calculate depth
  const depth = calculateDepth(json);

  return {
    byteSize,
    elementCount,
    depth,
  };
}

/**
 * Count leaf values in JSON structure
 * Leaf values are: strings, numbers, booleans, null
 * Containers (objects, arrays) are not counted
 */
function countElements(json: any): number {
  if (json === null || json === undefined) {
    return 1;
  }

  if (typeof json !== 'object') {
    return 1;
  }

  if (Array.isArray(json)) {
    let count = 0;
    for (const item of json) {
      count += countElements(item);
    }
    return count;
  }

  // Object
  let count = 0;
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      count += countElements(json[key]);
    }
  }
  return count;
}

/**
 * Calculate maximum nesting depth
 */
function calculateDepth(json: any): number {
  if (json === null || json === undefined) {
    return 0;
  }

  if (typeof json !== 'object') {
    return 0;
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return 1;
    }
    let maxDepth = 0;
    for (const item of json) {
      const depth = calculateDepth(item);
      maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth + 1;
  }

  // Object
  const keys = Object.keys(json);
  if (keys.length === 0) {
    return 1;
  }
  let maxDepth = 0;
  for (const key of keys) {
    const depth = calculateDepth(json[key]);
    maxDepth = Math.max(maxDepth, depth);
  }
  return maxDepth + 1;
}
