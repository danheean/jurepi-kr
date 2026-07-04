// Domain layer public API for JSON Formatter

// Constants
export { DEBOUNCE_MS, MAX_INPUT_SIZE, STORAGE_KEY, TOAST_DURATION_MS, MAX_FETCH_BYTES, DEFAULT_FILENAME } from './constants';

// Schema
export { formatOptionsSchema, storageSchema, parseStorage, serializeStorage } from './schema';
export type { FormatOptions, ParseError, ParseResult, StorageState } from './schema';

// Tokenizer
export { lineColFromParseError } from './tokenizer';
export type { TokenizeError } from './tokenizer';

// Format
export { formatJson } from './format';

// Minify
export { minifyJson } from './minify';

// Sort Keys
export { sortKeysRecursive } from './sort-keys';

// Tree Nodes
export { jsonToTreeNodes } from './tree-nodes';
export type { TreeNode } from './tree-nodes';

// Stats
export { getStats } from './stats';
export type { JsonStats } from './stats';

// Fetch URL
export { validateJsonUrl, fetchJsonFromUrl } from './fetch-url';
export type { JsonUrlError, JsonUrlErrorCode } from './fetch-url';
