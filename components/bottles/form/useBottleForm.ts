import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { BottleFormValues, bottleFormSchema } from './schema';

interface UseBottleFormArgs {
  defaultValues?: Partial<BottleFormValues>;
}

export function useBottleForm({ defaultValues }: UseBottleFormArgs = {}) {
  const previousQuantityRef = useRef(defaultValues?.quantity && defaultValues.quantity > 0 ? defaultValues.quantity : 1);

  const form = useForm<BottleFormValues>({
    resolver: zodResolver(bottleFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      producerName: defaultValues?.producerName ?? '',
      wineName: defaultValues?.wineName ?? '',
      vintage: defaultValues?.vintage ?? '',
      wineType: defaultValues?.wineType ?? '',
      country: defaultValues?.country ?? '',
      region: defaultValues?.region ?? '',
      subRegion: defaultValues?.subRegion ?? '',
      primaryGrape: defaultValues?.primaryGrape ?? '',
      bottleSize: defaultValues?.bottleSize ?? 750,
      quantity: defaultValues?.isWatchList ? 0 : defaultValues?.quantity ?? 1,
      acquisitionMethod: defaultValues?.acquisitionMethod ?? 'purchased',
      purchasePrice: defaultValues?.purchasePrice ?? '',
      currency: defaultValues?.currency ?? 'USD',
      purchaseDate: defaultValues?.purchaseDate ?? '',
      purchaseLocation: defaultValues?.purchaseLocation ?? '',
      storageLocation: defaultValues?.storageLocation ?? '',
      personalNotes: defaultValues?.personalNotes ?? '',
      tags: defaultValues?.tags ?? [],
      isWatchList: defaultValues?.isWatchList ?? false,
      existingWineId: defaultValues?.existingWineId ?? '',
    },
  });

  const isWatchList = form.watch('isWatchList');

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'quantity' && !form.getValues('isWatchList')) {
        const nextQuantity = value.quantity;
        if (typeof nextQuantity === 'number' && Number.isFinite(nextQuantity) && nextQuantity > 0) {
          previousQuantityRef.current = nextQuantity;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const currentQuantity = form.getValues('quantity');

    if (isWatchList) {
      if (currentQuantity > 0) {
        previousQuantityRef.current = currentQuantity;
      }
      if (currentQuantity !== 0) {
        form.setValue('quantity', 0, { shouldDirty: true, shouldValidate: false });
      }
    } else if (currentQuantity === 0) {
      const restored = previousQuantityRef.current > 0 ? previousQuantityRef.current : 1;
      form.setValue('quantity', restored, { shouldDirty: true, shouldValidate: false });
    }
  }, [form, isWatchList]);

  return { form, previousQuantityRef };
}
