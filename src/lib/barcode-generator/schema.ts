/**
 * Barcode Generator — zod Validation Schemas
 */

import { z } from 'zod';

/**
 * 바코드 형식 열거형 스키마
 */
export const BarcodeFormatSchema = z.enum(['EAN13', 'UPC', 'CODE39', 'CODE128']);

/**
 * 바코드 입력 스키마
 */
export const BarcodeInputSchema = z.object({
  data: z
    .string()
    .min(1, 'data_required')
    .max(256, 'data_too_long'),
  format: BarcodeFormatSchema,
});

/**
 * 바코드 옵션 스키마
 */
export const BarcodeOptionsSchema = z.object({
  width: z.number().min(100).max(300).default(200),
  textVisible: z.boolean().default(true),
});

/**
 * localStorage 지속 상태 스키마 (jurepi-barcode-generator 키)
 * 파싱 실패 시 fresh 시작 — 절대 throw하지 않는다(호출부에서 safeParse 사용)
 */
export const BarcodeStoreSchema = z.object({
  version: z.literal(1),
  recentInputs: z.array(z.string().max(100)).max(5),
  lastFormat: BarcodeFormatSchema,
  lastWidth: z.number().min(100).max(300),
});

/**
 * 타입 추론
 */
export type BarcodeInput = z.infer<typeof BarcodeInputSchema>;
export type BarcodeOptions = z.infer<typeof BarcodeOptionsSchema>;
export type BarcodeFormat = z.infer<typeof BarcodeFormatSchema>;
export type BarcodeStore = z.infer<typeof BarcodeStoreSchema>;
