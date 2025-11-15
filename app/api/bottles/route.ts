/**
 * Bottles API Routes
 *
 * POST /api/bottles - Create new bottle
 * GET /api/bottles - List bottles with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bottleSchema } from '@/lib/validations/bottle';
import { findBestWineMatch } from '@/lib/utils/wine-matching';
import { generateWineDescription } from '@/lib/ai/wine-description';
import { normalizeBottleRecord } from '@/lib/utils/supabase-normalize';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

const WINE_SELECT_FIELDS = 'id,name,producer_name,wine_type,vintage,country,region,sub_region,primary_grape,primary_label_image_url';

/**
 * POST /api/bottles - Create new bottle
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    const formData = await request.formData();

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

    let wineRecord: any = null;
    let createdNewWine = false;

    if (validatedData.existingWineId) {
      const { data: existingWine, error: existingWineError } = await supabase
        .from('wines')
        .select(WINE_SELECT_FIELDS)
        .eq('id', validatedData.existingWineId)
        .maybeSingle();

      if (existingWineError || !existingWine) {
        return NextResponse.json({ error: 'Selected wine could not be found' }, { status: 404 });
      }

      wineRecord = existingWine;

      if (labelImageUrl && !existingWine.primary_label_image_url) {
        const { error: updateError } = await supabase
          .from('wines')
          .update({ primary_label_image_url: labelImageUrl })
          .eq('id', existingWine.id);

        if (updateError) {
          console.error('Error updating wine image:', updateError);
        } else {
          wineRecord = { ...existingWine, primary_label_image_url: labelImageUrl };
        }
      }
    } else {
      console.log('Searching for matching wine...');
      const { data: candidates, error: searchError } = await supabase
        .from('wines')
        .select(WINE_SELECT_FIELDS)
        .ilike('producer_name', `%${validatedData.producerName}%`)
        .limit(20);

      if (searchError) {
        console.error('Error searching for wines:', searchError);
      }

      const candidateList = candidates || [];

      const mappedCandidates = candidateList.map((wine) => ({
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
        console.log(
          `Found matching wine: ${match.wine.name} (${Math.round(match.score * 100)}% match)`
        );
        const matchedWine = candidateList.find((wine) => wine.id === match.wine.id);

        if (!matchedWine) {
          return NextResponse.json({ error: 'Matched wine could not be retrieved' }, { status: 500 });
        }

        wineRecord = matchedWine;

        if (labelImageUrl && !matchedWine.primary_label_image_url) {
          const { error: updateError } = await supabase
            .from('wines')
            .update({ primary_label_image_url: labelImageUrl })
            .eq('id', matchedWine.id);

          if (updateError) {
            console.error('Error updating wine image:', updateError);
          } else {
            wineRecord = { ...matchedWine, primary_label_image_url: labelImageUrl };
          }
        }
      } else {
        console.log('No match found, creating new wine');
        const { data: newWine, error: createError } = await supabase
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
          .select(WINE_SELECT_FIELDS)
          .single();

        if (createError || !newWine) {
          console.error('Error creating wine:', createError);
          return NextResponse.json(
            { error: createError?.message || 'Failed to create wine' },
            { status: 500 }
          );
        }

        wineRecord = newWine;
        createdNewWine = true;
      }
    }

    if (!wineRecord) {
      return NextResponse.json(
        { error: 'Could not determine which wine this bottle belongs to' },
        { status: 500 }
      );
    }

    const { data: bottleRow, error: bottleError } = await supabase
      .from('bottles')
      .insert({
        user_id: user.id,
        wine_id: wineRecord.id,
        bottle_size: validatedData.bottleSize,
        quantity: validatedData.quantity,
        purchase_price: validatedData.purchasePrice ? String(validatedData.purchasePrice) : null,
        currency: validatedData.currency,
        purchase_date: validatedData.purchaseDate
          ? new Date(validatedData.purchaseDate).toISOString()
          : null,
        purchase_location: validatedData.purchaseLocation || null,
        storage_location: validatedData.storageLocation || null,
        personal_notes: validatedData.personalNotes || null,
        label_image_url: labelImageUrl || null,
        tags: validatedData.tags,
        acquisition_method: validatedData.acquisitionMethod,
        status: validatedData.status,
      })
      .select('id')
      .single();

    if (bottleError || !bottleRow) {
      console.error('Error creating bottle:', bottleError);
      return NextResponse.json(
        { error: bottleError?.message || 'Failed to create bottle' },
        { status: 500 }
      );
    }

    if (createdNewWine) {
      const wineId = wineRecord.id;
      // Generate AI description in background (non-blocking)
      Promise.resolve().then(async () => {
        try {
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

          if (!generated) return;

          const updates: Record<string, unknown> = {
            description: generated.description,
            ai_generated_summary: generated.summary,
            enrichment_data: generated.enrichmentData,
            enrichment_generated_at: new Date().toISOString(),
            enrichment_version: '2.0.0',
          };

          const { error: updateError } = await supabase
            .from('wines')
            .update(updates)
            .eq('id', wineId);

          if (updateError) {
            console.error('Error updating wine with AI description:', updateError);
          }
        } catch (backgroundError) {
          console.error('Error generating AI description:', backgroundError);
        }
      });
    }

    return NextResponse.json({ success: true, bottle_id: bottleRow.id });
  } catch (error) {
    console.error('Error creating bottle:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create bottle',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bottles - List bottles with filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      wineType: searchParams.get('wineType') || undefined,
      region: searchParams.get('region') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const shouldInnerJoinWine = Boolean(
      (filters?.wineType && filters.wineType !== 'all') ||
        (filters?.region && filters.region.trim().length > 0)
    );

    const wineRelationship = shouldInnerJoinWine ? 'wine:wines!inner(*)' : 'wine:wines(*)';

    // Build Supabase query
    let query = supabase
      .from('bottles')
      .select(`
        *,
        ${wineRelationship}
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
    if (filters?.wineType && filters.wineType !== 'all') {
      query = query.eq('wine.wine_type', filters.wineType);
    }

    // Apply region filter
    if (filters?.region) {
      const region = filters.region.trim();
      if (region) {
        query = query.ilike('wine.region', `%${region}%`);
      }
    }

    // Apply search filter
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
          return NextResponse.json({ error: 'Failed to search wines' }, { status: 500 });
        }

        const wineIds = (matchingWines || []).map((wine) => wine.id);

        if (wineIds.length === 0) {
          return NextResponse.json({ bottles: [] });
        }

        query = query.in('wine_id', wineIds);
      }
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: bottles, error } = await query;

    if (error) {
      console.error('Error fetching bottles:', error);
      return NextResponse.json({ error: 'Failed to fetch bottles' }, { status: 500 });
    }

    const normalizedBottles = (bottles || []).map((bottle) => normalizeBottleRecord(bottle));

    return NextResponse.json({ bottles: normalizedBottles });
  } catch (error) {
    console.error('Error in GET /api/bottles:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bottles' },
      { status: 500 }
    );
  }
}
