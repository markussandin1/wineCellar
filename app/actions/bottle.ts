'use server';

import { createClient } from '@/lib/supabase/server';
import { bottleSchema, consumeBottleSchema, editBottleSchema } from '@/lib/validations/bottle';
import { findBestWineMatch } from '@/lib/utils/wine-matching';
import { generateWineDescription } from '@/lib/ai/wine-description';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normalizeBottleRecord } from '@/lib/utils/supabase-normalize';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export async function createBottle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  await ensureUserRecord(supabase, user);

  // Parse and validate form data
  const rawData = {
    wineName: formData.get('wineName'),
    vintage: formData.get('vintage') || null,
    producerName: formData.get('producerName'),
    wineType: formData.get('wineType'),
    country: formData.get('country'),
    region: formData.get('region'),
    subRegion: formData.get('subRegion') || '',
    primaryGrape: formData.get('primaryGrape') || '',
    bottleSize: formData.get('bottleSize') || 750,
    quantity: formData.get('quantity') || 1,
    purchasePrice: formData.get('purchasePrice') || undefined,
    currency: formData.get('currency') || 'USD',
    purchaseDate: formData.get('purchaseDate') || undefined,
    purchaseLocation: formData.get('purchaseLocation') || '',
    storageLocation: formData.get('storageLocation') || '',
    personalNotes: formData.get('personalNotes') || '',
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
    acquisitionMethod: formData.get('acquisitionMethod') || 'purchased',
    existingWineId: formData.get('existingWineId') || undefined,
    status: formData.get('status') || 'in_cellar',
  };

  const labelImageUrl = formData.get('labelImageUrl') as string | null;

  const validatedData = bottleSchema.parse(rawData);

  try {
    let wineRecord: any = null;
    let createdNewWine = false;

    if (validatedData.existingWineId) {
      const { data: wines, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', validatedData.existingWineId);

      if (error || !wines || wines.length === 0) {
        throw new Error('Selected wine could not be found');
      }

      wineRecord = wines[0];

      if (labelImageUrl && !wineRecord.primary_label_image_url) {
        const { data: updatedWines, error: updateError } = await supabase
          .from('wines')
          .update({ primary_label_image_url: labelImageUrl })
          .eq('id', wineRecord.id)
          .select('*');

        if (updateError) {
          console.error('Error updating wine image:', updateError);
        } else if (updatedWines && updatedWines.length > 0) {
          wineRecord = updatedWines[0];
        }
      }
    } else {
      console.log('Searching for matching wine...');
      const { data: candidates, error: searchError } = await supabase
        .from('wines')
        .select('*')
        .ilike('producer_name', `%${validatedData.producerName}%`)
        .limit(20);

      if (searchError) {
        console.error('Error searching for wines:', searchError);
      }

      // Map snake_case from DB to camelCase for wine matching
      const mappedCandidates = (candidates || []).map(wine => ({
        ...wine,
        producerName: wine.producer_name,
      }));

      const match = findBestWineMatch(
        {
          name: validatedData.wineName,
          producerName: validatedData.producerName,
          vintage: validatedData.vintage,
        },
        mappedCandidates
      );

      if (match) {
        console.log(`Found matching wine: ${match.wine.name} (${Math.round(match.score * 100)}% match)`);
        const { data: wines, error } = await supabase
          .from('wines')
          .select('*')
          .eq('id', match.wine.id);

        if (error || !wines || wines.length === 0) {
          throw new Error('Matched wine could not be retrieved');
        }

        wineRecord = wines[0];

      if (labelImageUrl && !wineRecord.primary_label_image_url) {
          const { data: updatedWines, error: updateError } = await supabase
            .from('wines')
            .update({ primary_label_image_url: labelImageUrl })
            .eq('id', wineRecord.id)
            .select('*');

          if (updateError) {
            console.error('Error updating wine image:', updateError);
          } else if (updatedWines && updatedWines.length > 0) {
            wineRecord = updatedWines[0];
          }
        }
      } else {
        console.log('No match found, creating new wine');
        const { data: newWines, error: createError } = await supabase
          .from('wines')
          .insert({
            name: validatedData.wineName,
            full_name: `${validatedData.producerName} ${validatedData.wineName} ${validatedData.vintage || 'NV'}`,
            vintage: validatedData.vintage ?? null,
            producer_name: validatedData.producerName,
            wine_type: validatedData.wineType,
            country: validatedData.country,
            region: validatedData.region,
            sub_region: validatedData.subRegion || null,
            primary_grape: validatedData.primaryGrape || null,
            primary_label_image_url: labelImageUrl || null,
          })
          .select('*');

      if (createError || !newWines || newWines.length === 0) {
        console.error('Error creating wine:', createError);
        throw new Error(createError?.message || 'Failed to create wine');
      }

        wineRecord = newWines[0];
        createdNewWine = true;
      }
    }

    if (!wineRecord) {
      throw new Error('Could not determine which wine this bottle belongs to');
    }

    const { data: newBottles, error: bottleError } = await supabase
      .from('bottles')
      .insert({
        user_id: user.id,
        wine_id: wineRecord.id,
        bottle_size: validatedData.bottleSize,
        quantity: validatedData.quantity,
        purchase_price: validatedData.purchasePrice ? String(validatedData.purchasePrice) : null,
        currency: validatedData.currency,
        purchase_date: validatedData.purchaseDate ? new Date(validatedData.purchaseDate).toISOString() : null,
        purchase_location: validatedData.purchaseLocation || null,
        storage_location: validatedData.storageLocation || null,
        personal_notes: validatedData.personalNotes || null,
        label_image_url: labelImageUrl || null,
        tags: validatedData.tags,
        acquisition_method: validatedData.acquisitionMethod,
        status: validatedData.status,
      })
      .select(`
        *,
        wine:wines(*)
      `);

    if (bottleError || !newBottles || newBottles.length === 0) {
      console.error('Error creating bottle:', bottleError);
      throw new Error(bottleError?.message || 'Failed to create bottle');
    }

    const bottle = newBottles[0];

    if (createdNewWine) {
      const generated = await generateWineDescription({
        name: wineRecord.name,
        producerName: wineRecord.producer_name,
        wineType: wineRecord.wine_type ? wineRecord.wine_type.toString() : undefined,
        vintage: wineRecord.vintage,
        country: wineRecord.country,
        region: wineRecord.region,
        subRegion: wineRecord.sub_region,
        primaryGrape: wineRecord.primary_grape,
      });

      if (generated) {
        const { error: updateError } = await supabase
          .from('wines')
          .update({
            description: generated.description,
            ai_generated_summary: generated.summary,
          })
          .eq('id', wineRecord.id);

        if (updateError) {
          console.error('Error updating wine with AI description:', updateError);
        }
      }
    }

    revalidatePath('/cellar');
    revalidatePath('/dashboard');

    return { success: true, bottle_id: bottle.id };
  } catch (error) {
    console.error('Error creating bottle:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bottle',
    };
  }
}

export async function getBottles(filters?: {
  wineType?: string;
  region?: string;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  await ensureUserRecord(supabase, user);

  // Build Supabase query
  let query = supabase
    .from('bottles')
    .select(`
      *,
      wine:wines(*)
    `)
    .eq('user_id', user.id);

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'watchlist') {
      query = query.in('status', ['gifted', 'other']);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  // Apply wine type filter
  if (filters?.wineType) {
    query = query.eq('wine.wine_type', filters.wineType);
  }

  // Apply region filter
  if (filters?.region) {
    query = query.ilike('wine.region', `%${filters.region}%`);
  }

  // Apply search filter (search in wine name or producer name)
  if (filters?.search) {
    const searchTerm = filters.search.trim();
    if (searchTerm) {
      const escapeLike = (value: string) =>
        value.replace(/[%_]/g, (match) => `\\${match}`);

      const likePattern = `%${escapeLike(searchTerm)}%`;

      const { data: matchingWines, error: wineSearchError } = await supabase
        .from('wines')
        .select('id')
        .or(`name.ilike.${likePattern},producer_name.ilike.${likePattern}`);

      if (wineSearchError) {
        console.error('Error searching wines for bottle filter:', wineSearchError);
        throw new Error('Failed to search wines');
      }

      const wineIds = (matchingWines || []).map((wine) => wine.id);

      if (wineIds.length === 0) {
        return [];
      }

      query = query.in('wine_id', wineIds);
    }
  }

  // Order by creation date
  query = query.order('created_at', { ascending: false });

  const { data: bottles, error } = await query;

  if (error) {
    console.error('Error fetching bottles:', error);
    throw new Error('Failed to fetch bottles');
  }

  return (bottles || []).map((bottle) => normalizeBottleRecord(bottle));
}

export async function getBottle(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  await ensureUserRecord(supabase, user);

  await ensureUserRecord(supabase, user);

  // Get bottle with wine and consumption logs
  const { data: bottles, error } = await supabase
    .from('bottles')
    .select(`
      *,
      wine:wines(*),
      consumptionLogs:consumption_logs(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching bottle:', error);
    throw new Error('Failed to fetch bottle');
  }

  const bottle = bottles?.[0];
  if (!bottle) return null;

  const normalizedBottle = normalizeBottleRecord(bottle);

  if (Array.isArray(normalizedBottle.consumptionLogs)) {
    normalizedBottle.consumptionLogs.sort((a: any, b: any) =>
      new Date(b.consumedDate).getTime() - new Date(a.consumedDate).getTime()
    );
  }

  return normalizedBottle;
}

export async function updateBottle(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  await ensureUserRecord(supabase, user);

  const validatedData = editBottleSchema.parse(data);

  // Verify ownership
  const { data: existingBottles, error: fetchError } = await supabase
    .from('bottles')
    .select('id')
    .eq('id', validatedData.id)
    .eq('user_id', user.id);

  if (fetchError || !existingBottles || existingBottles.length === 0) {
    throw new Error('Bottle not found');
  }

  const updateData: any = {};

  if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity;
  if (validatedData.purchasePrice !== undefined) updateData.purchase_price = String(validatedData.purchasePrice);
  if (validatedData.currency) updateData.currency = validatedData.currency;
  if (validatedData.purchaseDate) updateData.purchase_date = new Date(validatedData.purchaseDate).toISOString();
  if (validatedData.purchaseLocation !== undefined) updateData.purchase_location = validatedData.purchaseLocation;
  if (validatedData.storageLocation !== undefined) updateData.storage_location = validatedData.storageLocation;
  if (validatedData.personalNotes !== undefined) updateData.personal_notes = validatedData.personalNotes;
  if (validatedData.tags) updateData.tags = validatedData.tags;
  if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
  if (validatedData.labelImageUrl !== undefined) updateData.label_image_url = validatedData.labelImageUrl;
  if (validatedData.status) updateData.status = validatedData.status;

  const { data: updatedBottles, error: updateError } = await supabase
    .from('bottles')
    .update(updateData)
    .eq('id', validatedData.id)
    .select(`
      *,
      wine:wines(*)
    `);

  if (updateError || !updatedBottles || updatedBottles.length === 0) {
    console.error('Error updating bottle:', updateError);
    throw new Error('Failed to update bottle');
  }

  const bottle = normalizeBottleRecord(updatedBottles[0]);

  revalidatePath('/cellar');
  revalidatePath(`/bottle/${validatedData.id}`);

  return { success: true, bottle };
}

export async function deleteBottle(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  await ensureUserRecord(supabase, user);

  // Verify ownership
  const { data: existingBottles, error: fetchError } = await supabase
    .from('bottles')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id);

  if (fetchError || !existingBottles || existingBottles.length === 0) {
    throw new Error('Bottle not found');
  }

  const { error: deleteError } = await supabase
    .from('bottles')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting bottle:', deleteError);
    throw new Error('Failed to delete bottle');
  }

  revalidatePath('/cellar');
  revalidatePath('/dashboard');

  redirect('/cellar');
}

export async function consumeBottle(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  await ensureUserRecord(supabase, user);

  const validatedData = consumeBottleSchema.parse(data);

  // Verify ownership and get bottle
  const { data: bottles, error: fetchError } = await supabase
    .from('bottles')
    .select(`
      *,
      wine:wines(*)
    `)
    .eq('id', validatedData.bottleId)
    .eq('user_id', user.id);

  if (fetchError || !bottles || bottles.length === 0) {
    throw new Error('Bottle not found');
  }

  const bottle = normalizeBottleRecord(bottles[0]);

  // Create consumption log
  const { error: logError } = await supabase
    .from('consumption_logs')
    .insert({
      bottle_id: validatedData.bottleId,
      user_id: user.id,
      wine_id: bottle.wineId!,
      consumed_date: new Date(validatedData.consumedDate).toISOString(),
      quantity_consumed: validatedData.quantityConsumed,
      rating: validatedData.rating,
      tasting_notes: validatedData.tastingNotes,
      occasion: validatedData.occasion,
      companions: validatedData.companions,
      location: validatedData.location,
    });

  if (logError) {
    console.error('Error creating consumption log:', logError);
    throw new Error('Failed to create consumption log');
  }

  // Update bottle quantity and status
  const newQuantity = bottle.quantity - validatedData.quantityConsumed;

  const { error: updateError } = await supabase
    .from('bottles')
    .update({
      quantity: newQuantity,
      status: newQuantity === 0 ? 'consumed' : 'in_cellar',
      consumed_date: newQuantity === 0 ? new Date(validatedData.consumedDate).toISOString() : null,
      rating: validatedData.rating || bottle.rating,
    })
    .eq('id', validatedData.bottleId);

  if (updateError) {
    console.error('Error updating bottle:', updateError);
    throw new Error('Failed to update bottle');
  }

  revalidatePath('/cellar');
  revalidatePath(`/bottle/${validatedData.bottleId}`);
  revalidatePath('/dashboard');

  return { success: true };
}

export async function createBottleFromScan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  const existingWineId = formData.get('existingWineId');
  const imageUrlEntry = formData.get('imageUrl');
  const imageUrl = typeof imageUrlEntry === 'string' && imageUrlEntry.length > 0 ? imageUrlEntry : null;

  // Parse wine data
  const wineData = {
    wineName: formData.get('wineName') as string,
    vintage: formData.get('vintage') as string | null,
    producerName: formData.get('producerName') as string,
    wineType: formData.get('wineType') as string,
    country: formData.get('country') as string,
    region: formData.get('region') as string,
    subRegion: (formData.get('subRegion') as string) || '',
    primaryGrape: (formData.get('primaryGrape') as string) || '',
  };

  // Parse bottle data
  const bottleData = {
    bottleSize: Number(formData.get('bottleSize')) || 750,
    quantity: Number(formData.get('quantity')) || 1,
    purchasePrice: formData.get('purchasePrice') ? String(formData.get('purchasePrice')) : null,
    currency: (formData.get('currency') as string) || 'SEK',
    purchaseDate: (formData.get('purchaseDate') as string) || undefined,
    purchaseLocation: (formData.get('purchaseLocation') as string) || '',
    storageLocation: (formData.get('storageLocation') as string) || '',
    personalNotes: (formData.get('personalNotes') as string) || '',
    acquisitionMethod: (formData.get('acquisitionMethod') as string) || 'purchased',
    status: (formData.get('status') as string) || 'in_cellar',
  };

  try {
    let wineRecord: any = null;
    let createdNewWine = false;

    if (existingWineId) {
      const { data: wines, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', existingWineId as string);

      if (error || !wines || wines.length === 0) {
        throw new Error('Selected wine could not be found');
      }

      wineRecord = wines[0];

      if (imageUrl && !wineRecord.primary_label_image_url) {
        const { data: updatedWines, error: updateError } = await supabase
          .from('wines')
          .update({ primary_label_image_url: imageUrl })
          .eq('id', wineRecord.id)
          .select('*');

        if (updateError) {
          console.error('Error updating wine image:', updateError);
        } else if (updatedWines && updatedWines.length > 0) {
          wineRecord = updatedWines[0];
          console.log('Set primary label image for existing wine');
        }
      }
    } else {
      const { data: newWines, error: createError } = await supabase
        .from('wines')
        .insert({
          name: wineData.wineName,
          full_name: `${wineData.producerName} ${wineData.wineName} ${wineData.vintage || 'NV'}`,
          vintage: wineData.vintage ? Number(wineData.vintage) : null,
          producer_name: wineData.producerName,
          wine_type: wineData.wineType as any,
          country: wineData.country,
          region: wineData.region,
          sub_region: wineData.subRegion || null,
          primary_grape: wineData.primaryGrape || null,
          primary_label_image_url: imageUrl,
        })
        .select('*');

      if (createError || !newWines || newWines.length === 0) {
        console.error('Error creating wine:', createError);
        throw new Error(createError?.message || 'Failed to create wine');
      }

      wineRecord = newWines[0];
      createdNewWine = true;
      console.log('Created new wine:', wineRecord.id);
    }

    if (!wineRecord) {
      throw new Error('Could not create or locate wine record');
    }

    const { data: newBottles, error: bottleError} = await supabase
      .from('bottles')
      .insert({
        user_id: user.id,
        wine_id: wineRecord.id,
        bottle_size: bottleData.bottleSize,
        quantity: bottleData.quantity,
        purchase_price: bottleData.purchasePrice,
        currency: bottleData.currency,
        purchase_date: bottleData.purchaseDate ? new Date(bottleData.purchaseDate).toISOString() : null,
        purchase_location: bottleData.purchaseLocation || null,
        storage_location: bottleData.storageLocation || null,
        personal_notes: bottleData.personalNotes || null,
        label_image_url: imageUrl,
        tags: [],
        acquisition_method: bottleData.acquisitionMethod as any,
        status: bottleData.status as any,
      })
      .select(`
        *,
        wine:wines(*)
      `);

    if (bottleError || !newBottles || newBottles.length === 0) {
      console.error('Error creating bottle:', bottleError);
      throw new Error(bottleError?.message || 'Failed to create bottle');
    }

    const bottle = newBottles[0];

    if (createdNewWine) {
      const generated = await generateWineDescription({
        name: wineRecord.name,
        producerName: wineRecord.producer_name,
        wineType: wineRecord.wine_type ? wineRecord.wine_type.toString() : undefined,
        vintage: wineRecord.vintage,
        country: wineRecord.country,
        region: wineRecord.region,
        subRegion: wineRecord.sub_region,
        primaryGrape: wineRecord.primary_grape,
      });

      if (generated) {
        const { error: updateError } = await supabase
          .from('wines')
          .update({
            description: generated.description,
            ai_generated_summary: generated.summary,
          })
          .eq('id', wineRecord.id);

        if (updateError) {
          console.error('Error updating wine with AI description:', updateError);
        }
      }
    }

    if (imageUrl) {
      const { error: scanError } = await supabase
        .from('label_scans')
        .insert({
          user_id: user.id,
          bottle_id: bottle.id,
          imageUrl,
          extracted_data: wineData,
          user_confirmed: true,
        });

      if (scanError) {
        console.error('Error creating label scan:', scanError);
        // Don't fail the whole operation if label scan fails
      }
    }

    revalidatePath('/cellar');
    revalidatePath('/dashboard');

    return { success: true, bottle_id: bottle.id };
  } catch (error) {
    console.error('Error creating bottle from scan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bottle',
    };
  }
}
