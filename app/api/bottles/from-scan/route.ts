/**
 * Create Bottle from Label Scan
 *
 * POST /api/bottles/from-scan - Create bottle from scanned label data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bottles/from-scan - Create bottle from scanned label
 *
 * This is called after label scanning is complete and wine has been created/matched.
 * It creates the bottle record and associates it with the wine.
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

    const existingWineId = formData.get('existingWineId');
    const imageUrlEntry = formData.get('imageUrl');
    const imageUrl =
      typeof imageUrlEntry === 'string' && imageUrlEntry.length > 0 ? imageUrlEntry : null;

    // Parse wine data (for label scan record)
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
      purchasePrice: formData.get('purchasePrice')
        ? String(formData.get('purchasePrice'))
        : null,
      currency: (formData.get('currency') as string) || 'SEK',
      purchaseDate: (formData.get('purchaseDate') as string) || undefined,
      purchaseLocation: (formData.get('purchaseLocation') as string) || '',
      storageLocation: (formData.get('storageLocation') as string) || '',
      personalNotes: (formData.get('personalNotes') as string) || '',
      acquisitionMethod: (formData.get('acquisitionMethod') as string) || 'purchased',
      status: (formData.get('status') as string) || 'in_cellar',
    };

    // Wine MUST already exist - it should have been created/matched during the scan phase
    if (!existingWineId) {
      return NextResponse.json(
        {
          error:
            'Wine ID is required. The wine should have been created during the scan phase.',
        },
        { status: 400 }
      );
    }

    // Fetch the existing wine
    const { data: wines, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', existingWineId as string);

    if (error || !wines || wines.length === 0) {
      return NextResponse.json(
        { error: 'Wine could not be found in database' },
        { status: 404 }
      );
    }

    const wineRecord = wines[0];

    // Update wine's primary label image if it doesn't have one yet
    if (imageUrl && !wineRecord.primary_label_image_url) {
      const { error: updateError } = await supabase
        .from('wines')
        .update({ primary_label_image_url: imageUrl })
        .eq('id', wineRecord.id);

      if (updateError) {
        console.error('Error updating wine image:', updateError);
      } else {
        console.log('Set primary label image for wine');
      }
    }

    const { data: newBottles, error: bottleError } = await supabase
      .from('bottles')
      .insert({
        user_id: user.id,
        wine_id: wineRecord.id,
        bottle_size: bottleData.bottleSize,
        quantity: bottleData.quantity,
        purchase_price: bottleData.purchasePrice,
        currency: bottleData.currency,
        purchase_date: bottleData.purchaseDate
          ? new Date(bottleData.purchaseDate).toISOString()
          : null,
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
      return NextResponse.json(
        { error: bottleError?.message || 'Failed to create bottle' },
        { status: 500 }
      );
    }

    const bottle = newBottles[0];

    // Create label scan record
    if (imageUrl) {
      const { error: scanError } = await supabase.from('label_scans').insert({
        user_id: user.id,
        bottle_id: bottle.id,
        image_url: imageUrl,
        extracted_data: wineData,
        user_confirmed: true,
      });

      if (scanError) {
        console.error('Error creating label scan:', scanError);
        // Don't fail the whole operation if label scan fails
      }
    }

    return NextResponse.json({ success: true, bottle_id: bottle.id });
  } catch (error) {
    console.error('Error creating bottle from scan:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create bottle',
      },
      { status: 500 }
    );
  }
}
