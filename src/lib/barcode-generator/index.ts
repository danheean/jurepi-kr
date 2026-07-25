/**
 * Barcode Generator — Public API
 */

// schema.ts already exports BarcodeInput, BarcodeOptions, BarcodeFormat (inferred from zod)
export * from './schema';
// Export additional types from types.ts that schema doesn't cover
export type { EncodedBarcode, BarcodeValidationResult, BarcodeErrorCode } from './types';
export { validateInput } from './validation';
export { encodeBarcode, loadBarcodeEncoder, validateChecksum } from './encoder';
export { normalizeBarcodeSVG } from './svg-export';
