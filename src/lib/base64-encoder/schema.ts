import { z } from 'zod';

/**
 * Domain layer schema definitions for Base64 Encoder/Decoder.
 * These types are consumed by useBase64 hook and domain functions.
 */

// Constants
export const FILE_SIZE_LIMIT_MB = 5;
export const DEBOUNCE_MS = 200;
export const STORAGE_KEY = 'jurepi-base64-encoder';

// Error types
export const BASE64_ENCODER_ERROR_CODES = [
  'invalidBase64',
  'notUtf8',
  'fileTooLarge',
  'fileReadError',
] as const;

export type Base64EncoderErrorCode = typeof BASE64_ENCODER_ERROR_CODES[number];

export const base64EncoderErrorSchema = z.object({
  code: z.enum(BASE64_ENCODER_ERROR_CODES),
  message: z.string().describe('Fallback error message in English'),
  details: z.string().optional().describe('Additional context (e.g., invalid character)'),
});

export type Base64EncoderError = z.infer<typeof base64EncoderErrorSchema>;

// Result types (discriminated unions)
export const encodeResultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    base64: z.string(),
    dataUri: z.string(),
    sizeBytes: z.number().positive(),
  }),
  z.object({
    ok: z.literal(false),
    error: base64EncoderErrorSchema,
  }),
]);

export type EncodeResult = z.infer<typeof encodeResultSchema>;

export const decodeResultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    plaintext: z.string(),
    sizeBytes: z.number().positive(),
  }),
  z.object({
    ok: z.literal(false),
    error: base64EncoderErrorSchema,
  }),
]);

export type DecodeResult = z.infer<typeof decodeResultSchema>;

// Smart decode result: text, image, or error.
// `decodeSmart` sniffs the decoded bytes and returns an image payload (ready
// for an <img> data URI) when the content is a known image format.
export const decodeSmartResultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    kind: z.literal('text'),
    plaintext: z.string(),
    sizeBytes: z.number().nonnegative(),
  }),
  z.object({
    ok: z.literal(true),
    kind: z.literal('image'),
    mimeType: z.string(),
    /** Standard (non URL-safe) Base64 body, for blob reconstruction. */
    base64: z.string(),
    /** `data:<mime>;base64,<body>` — usable directly as an <img> src. */
    dataUri: z.string(),
    sizeBytes: z.number().positive(),
  }),
  z.object({
    ok: z.literal(true),
    kind: z.literal('file'),
    /** Declared (non-text, non-image) MIME — e.g. application/pdf. */
    mimeType: z.string(),
    /** Standard (non URL-safe) Base64 body, for blob reconstruction. */
    base64: z.string(),
    sizeBytes: z.number().positive(),
  }),
  z.object({
    ok: z.literal(false),
    error: base64EncoderErrorSchema,
  }),
]);

export type DecodeSmartResult = z.infer<typeof decodeSmartResultSchema>;

export type DecodedImage = {
  mimeType: string;
  base64: string;
  dataUri: string;
  sizeBytes: number;
};

export type DecodedFile = {
  mimeType: string;
  base64: string;
  sizeBytes: number;
};

// File metadata
export const fileInfoSchema = z.object({
  name: z.string(),
  sizeBytes: z.number().positive(),
  mimeType: z.string(),
});

export type FileInfo = z.infer<typeof fileInfoSchema>;

// Persisted user preferences
export const persistedPrefsSchema = z
  .object({
    mode: z.enum(['text', 'file']).optional().default('text'),
    variant: z.enum(['standard', 'urlSafe']).optional().default('standard'),
  })
  .strict();

export type PersistedPrefs = z.infer<typeof persistedPrefsSchema>;

// Mode and variant enums for clearer usage
export const ModeEnum = z.enum(['text', 'file']);
export const VariantEnum = z.enum(['standard', 'urlSafe']);
export const DirectionEnum = z.enum(['encode', 'decode']);

export type Mode = z.infer<typeof ModeEnum>;
export type Variant = z.infer<typeof VariantEnum>;
export type Direction = z.infer<typeof DirectionEnum>;
