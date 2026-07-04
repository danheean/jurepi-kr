import { z } from 'zod';

export const STORE_VERSION = 1;

export const REGION_ENUM = [
  'seoul',
  'busan',
  'daegu',
  'daejeon',
  'gwangju',
  'ulsan',
  'gyeonggi',
  'gangwon',
  'chungbuk',
  'chungnam',
  'jeonbuk',
  'jeonnam',
  'gyeongbuk',
  'gyeongnam',
  'jeju',
  'nationwide',
] as const;

export const CATEGORY_ENUM = [
  'cafe',
  'korean',
  'japanese',
  'chinese',
  'brunch',
  'bar',
  'dessert',
  'other',
] as const;

// Validate coordinates within Korea bounds [33–39 lat, 124–132 lng]
const isValidKoreaCoord = (lat: number, lng: number) => {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
};

export const PlaceSchema = z.object({
  name: z.string().min(1, 'Place name is required'),
  lat: z.number().refine((lat) => lat >= 33 && lat <= 39, {
    message: 'Latitude must be between 33 and 39 (Korea bounds)',
  }),
  lng: z.number().refine((lng) => lng >= 124 && lng <= 132, {
    message: 'Longitude must be between 124 and 132 (Korea bounds)',
  }),
  category: z.enum(CATEGORY_ENUM),
  address: z.string().min(1, 'Address is required'),
  description: z.string().min(1, 'Description is required'),
  personalNote: z
    .string()
    .min(1, 'personalNote is required (non-empty)')
    .refine((val) => val.trim().length > 0, {
      message: 'personalNote cannot be empty or whitespace-only',
    }),
  link: z.string().url().optional(),
  priceRange: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageWidth: z.number().positive().optional(),
  imageHeight: z.number().positive().optional(),
  // id is derived at merge time, not authored
  id: z.string().optional(),
});

export type Place = z.infer<typeof PlaceSchema>;

export const PlaceFileFrontSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  region: z.enum(REGION_ENUM),
  city: z.string().optional(),
  asOfDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Invalid ISO date format'),
  sourceNote: z.string().min(1, 'sourceNote is required').max(200),
  sourceUrl: z.string().url().optional(),
  places: z.array(PlaceSchema).min(3, 'Must have at least 3 places'),
});

export type PlaceFileFront = z.infer<typeof PlaceFileFrontSchema>;

// Alias for backward compatibility and clarity
export const PlaceListFileFrontSchema = PlaceFileFrontSchema;
export type PlaceListFileFront = PlaceFileFront;

export const MergedPlaceListSchema = z.object({
  slug: z.string(),
  region: z.enum(REGION_ENUM),
  city: z.string().optional(),
  asOfDate: z.string(),
  sourceUrl: z.string().url().optional(),
  ko: z.object({
    title: z.string(),
    sourceNote: z.string(),
    places: z.array(PlaceSchema.extend({ id: z.string() })),
  }),
  en: z.object({
    title: z.string(),
    sourceNote: z.string(),
    places: z.array(PlaceSchema.extend({ id: z.string() })),
  }),
});

export type MergedPlaceList = z.infer<typeof MergedPlaceListSchema>;

export const RestaurantMapStoreSchema = z.object({
  version: z.number(),
  favorites: z.array(z.string()),
  recents: z.array(z.string()),
  userGeo: z
    .object({
      lat: z.number(),
      lng: z.number(),
      timestamp: z.number(),
    })
    .optional(),
  meta: z.object({
    lastRegion: z.string().optional(),
    createdAt: z.number(),
  }),
});

export type RestaurantMapStore = z.infer<typeof RestaurantMapStoreSchema>;
