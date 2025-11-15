/**
 * Individual Bottle API Routes
 *
 * GET /api/bottles/[id] - Get bottle by ID
 * PATCH /api/bottles/[id] - Update bottle
 * DELETE /api/bottles/[id] - Delete bottle
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { editBottleSchema } from '@/lib/validations/bottle';
import { normalizeBottleRecord } from '@/lib/utils/supabase-normalize';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bottles/[id] - Get bottle by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Failed to fetch bottle' }, { status: 500 });
    }

    const bottle = bottles?.[0];
    if (!bottle) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    const normalizedBottle = normalizeBottleRecord(bottle);

    if (Array.isArray(normalizedBottle.consumptionLogs)) {
      normalizedBottle.consumptionLogs.sort((a: any, b: any) =>
        new Date(b.consumedDate).getTime() - new Date(a.consumedDate).getTime()
      );
    }

    return NextResponse.json({ bottle: normalizedBottle });
  } catch (error) {
    console.error('Error in GET /api/bottles/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bottle' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bottles/[id] - Update bottle
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    const body = await request.json();
    const validatedData = editBottleSchema.parse({ ...body, id });

    // Verify ownership
    const { data: existingBottles, error: fetchError } = await supabase
      .from('bottles')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id);

    if (fetchError || !existingBottles || existingBottles.length === 0) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (validatedData.bottleSize !== undefined) updateData.bottle_size = validatedData.bottleSize;
    if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity;
    if (validatedData.purchasePrice !== undefined)
      updateData.purchase_price = String(validatedData.purchasePrice);
    if (validatedData.currency) updateData.currency = validatedData.currency;
    if (validatedData.purchaseDate)
      updateData.purchase_date = new Date(validatedData.purchaseDate).toISOString();
    if (validatedData.purchaseLocation !== undefined)
      updateData.purchase_location = validatedData.purchaseLocation;
    if (validatedData.storageLocation !== undefined)
      updateData.storage_location = validatedData.storageLocation;
    if (validatedData.personalNotes !== undefined)
      updateData.personal_notes = validatedData.personalNotes;
    if (validatedData.tags) updateData.tags = validatedData.tags;
    if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
    if (validatedData.labelImageUrl !== undefined)
      updateData.label_image_url = validatedData.labelImageUrl;
    if (validatedData.status) updateData.status = validatedData.status;

    const { data: updatedBottles, error: updateError } = await supabase
      .from('bottles')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        wine:wines(*)
      `);

    if (updateError || !updatedBottles || updatedBottles.length === 0) {
      console.error('Error updating bottle:', updateError);
      return NextResponse.json({ error: 'Failed to update bottle' }, { status: 500 });
    }

    const bottle = normalizeBottleRecord(updatedBottles[0]);

    return NextResponse.json({ success: true, bottle });
  } catch (error) {
    console.error('Error in PATCH /api/bottles/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update bottle' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bottles/[id] - Delete bottle
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    // Verify ownership
    const { data: existingBottles, error: fetchError } = await supabase
      .from('bottles')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id);

    if (fetchError || !existingBottles || existingBottles.length === 0) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from('bottles').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting bottle:', deleteError);
      return NextResponse.json({ error: 'Failed to delete bottle' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/bottles/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete bottle' },
      { status: 500 }
    );
  }
}
