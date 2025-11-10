import { z } from 'zod';

export const bottleSchema = z.object({
  // Wine Information (can be existing wine or new)
  wineId: z.string().uuid().optional(),
  existingWineId: z.string().uuid().optional(), // From autocomplete selection
  wineName: z.string().min(1, 'Wine name is required'),
  vintage: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 5).nullable().optional(),
  producerName: z.string().min(1, 'Producer name is required'),
  wineType: z.enum(['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified']),
  country: z.string().optional(),
  region: z.string().optional(),
  subRegion: z.string().optional(),
  primaryGrape: z.string().optional(),

  // Bottle-specific information
  bottleSize: z.coerce.number().int().positive().default(750), // Size in ml
  quantity: z.coerce.number().int().min(0).default(1),
  purchasePrice: z.coerce.number().positive().optional(),
  currency: z.string().default('USD'),
  purchaseDate: z.string().optional(), // ISO date string
  purchaseLocation: z.string().optional(),
  storageLocation: z.string().optional(),
  personalNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  acquisitionMethod: z.enum(['purchased', 'gift', 'trade', 'other']).default('purchased'),
  status: z.enum(['in_cellar', 'consumed', 'gifted', 'other']).default('in_cellar'),
});

export const consumeBottleSchema = z.object({
  bottleId: z.string().uuid(),
  consumedDate: z.string(), // ISO date string
  rating: z.coerce.number().int().min(1).max(5).optional(),
  tastingNotes: z.string().optional(),
  occasion: z.string().optional(),
  companions: z.array(z.string()).default([]),
  location: z.string().optional(),
  quantityConsumed: z.coerce.number().int().min(1).default(1),
});

export const editBottleSchema = z.object({
  id: z.string().uuid(),
  bottleSize: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  purchasePrice: z.coerce.number().positive().optional(),
  currency: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseLocation: z.string().optional(),
  storageLocation: z.string().optional(),
  personalNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  labelImageUrl: z.string().url().optional(),
  status: z.enum(['in_cellar', 'consumed', 'gifted', 'other']).optional(),
});

export type BottleFormData = z.infer<typeof bottleSchema>;
export type ConsumeBottleData = z.infer<typeof consumeBottleSchema>;
export type EditBottleData = z.infer<typeof editBottleSchema>;
