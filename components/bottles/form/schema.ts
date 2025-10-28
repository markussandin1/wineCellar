import { z } from 'zod';

const optionalText = z
  .string()
  .optional()
  .transform((value) => value ?? '');

export const bottleFormSchema = z.object({
  producerName: z.string().min(1, 'Producer is required'),
  wineName: z.string().min(1, 'Wine name is required'),
  vintage: optionalText,
  wineType: z.string().min(1, 'Wine type is required'),
  country: z.string().min(1, 'Country is required'),
  region: z.string().min(1, 'Region is required'),
  subRegion: optionalText,
  primaryGrape: optionalText,
  bottleSize: z
    .number({ invalid_type_error: 'Bottle size is required' })
    .positive('Bottle size must be positive'),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .min(0, 'Quantity cannot be negative'),
  acquisitionMethod: z.string().min(1, 'Acquisition method is required'),
  purchasePrice: optionalText,
  currency: z.string().min(1, 'Currency is required'),
  purchaseDate: optionalText,
  purchaseLocation: optionalText,
  storageLocation: optionalText,
  personalNotes: optionalText,
  tags: z.array(z.string()).optional(),
  isWatchList: z.boolean(),
  existingWineId: optionalText,
});

export type BottleFormValues = z.infer<typeof bottleFormSchema>;
