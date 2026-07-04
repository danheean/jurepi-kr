/**
 * Tree node structure for recursive JSON tree view
 */
export interface TreeNode {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  key?: string; // for object properties
  value?: any; // for leaf nodes
  children?: TreeNode[]; // for object/array
  depth: number;
}

/**
 * Convert JSON structure to tree nodes for UI rendering
 * Returns array of root-level nodes
 */
export function jsonToTreeNodes(json: any, depth: number = 0, key?: string): TreeNode {
  if (json === null) {
    return {
      type: 'null',
      key,
      value: null,
      depth,
    };
  }

  if (typeof json === 'boolean') {
    return {
      type: 'boolean',
      key,
      value: json,
      depth,
    };
  }

  if (typeof json === 'number') {
    return {
      type: 'number',
      key,
      value: json,
      depth,
    };
  }

  if (typeof json === 'string') {
    return {
      type: 'string',
      key,
      value: json,
      depth,
    };
  }

  if (Array.isArray(json)) {
    const children = json.map((item, index) =>
      jsonToTreeNodes(item, depth + 1, `[${index}]`)
    );
    return {
      type: 'array',
      key,
      value: `Array(${json.length})`,
      children,
      depth,
    };
  }

  if (typeof json === 'object') {
    const keys = Object.keys(json);
    const children = keys.map(objKey =>
      jsonToTreeNodes(json[objKey], depth + 1, objKey)
    );
    return {
      type: 'object',
      key,
      value: `Object(${keys.length})`,
      children,
      depth,
    };
  }

  // Fallback for unknown types
  return {
    type: 'string',
    key,
    value: String(json),
    depth,
  };
}
