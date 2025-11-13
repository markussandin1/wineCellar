/**
 * Consume Bottle API Route
 *
 * POST /api/bottles/[id]/consume - Record bottle consumption
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { consumeBottleSchema } from '@/lib/validations/bottle';
import { normalizeBottleRecord } from '@/lib/utils/supabase-normalize';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bottles/[id]/consume - Record bottle consumption
 */
export async function POST(
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
    const validatedData = consumeBottleSchema.parse({ ...body, bottleId: id });

    // Verify ownership and get bottle
    const { data: bottles, error: fetchError } = await supabase
      .from('bottles')
      .select(`
        *,
        wine:wines(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id);

    if (fetchError || !bottles || bottles.length === 0) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    const bottle = normalizeBottleRecord(bottles[0]);

    // Create consumption log
    const { error: logError } = await supabase.from('consumption_logs').insert({
      bottle_id: id,
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
      return NextResponse.json(
        { error: 'Failed to create consumption log' },
        { status: 500 }
      );
    }

    // Update bottle quantity and status
    const newQuantity = bottle.quantity - validatedData.quantityConsumed;

    const { error: updateError } = await supabase
      .from('bottles')
      .update({
        quantity: newQuantity,
        status: newQuantity === 0 ? 'consumed' : 'in_cellar',
        consumed_date:
          newQuantity === 0 ? new Date(validatedData.consumedDate).toISOString() : null,
        rating: validatedData.rating || bottle.rating,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating bottle:', updateError);
      return NextResponse.json({ error: 'Failed to update bottle' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/bottles/[id]/consume:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to consume bottle' },
      { status: 500 }
    );
  }
}
