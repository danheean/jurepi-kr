import { z } from 'zod';

export const MAX_INPUT_LENGTH = 2953;
export const CONTRAST_THRESHOLD = 50;
export const DEBOUNCE_MS = 100;
export const SIZE_STEP = 50;
export const STORE_VERSION = 1;
export const STORE_KEY = 'jurepi-qr-code';

export const qrInputSchema = z.object({
  data: z.string().min(1).max(MAX_INPUT_LENGTH),
  mode: z.enum(['text', 'url', 'wifi', 'vcard', 'email', 'sms']),
});

export const qrOptionsSchema = z.object({
  eccLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  size: z.number().int().min(200).max(500).default(300),
  quietZone: z.number().int().min(4).max(8).default(4),
  fgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2a2411'),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  logoUrl: z.string().optional(),
});

export const qrCodeStoreSchema = z.object({
  version: z.literal(1),
  recentInputs: z.array(z.string().max(100)).max(5).default([]),
  lastMode: z.enum(['text', 'url', 'wifi', 'vcard', 'email', 'sms']).default('text'),
  lastECC: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  lastFgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2a2411'),
  lastBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
});

export type QRCodeStore = z.infer<typeof qrCodeStoreSchema>;
