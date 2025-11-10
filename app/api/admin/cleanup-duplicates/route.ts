import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function POST() {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createClient();

    console.log('1️⃣  Checking all "The Butcher" wines...\n');

    const { data: wines, error: fetchError } = await supabase
      .from('wines')
      .select('id, name, producer_name, vintage, country, region, created_at')
      .ilike('name', 'the butcher')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching wines:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    console.log(`Found ${wines?.length || 0} wines`);

    if (!wines || wines.length === 0) {
      return NextResponse.json({ message: 'No wines found' });
    }

    // Find the correct wine (Schwartz) and duplicates
    const correctWine = wines.find(w => w.producer_name === 'Schwartz');
    const duplicates = wines.filter(w =>
      w.producer_name === 'ROMAN CZOPEL' ||
      w.producer_name === 'ROMAN EDEL' ||
      w.producer_name === 'THE BUTCHER'
    );

    if (!correctWine) {
      return NextResponse.json({ error: 'Could not find the correct wine (Schwartz)' }, { status: 404 });
    }

    console.log(`✅ Correct wine to keep: "${correctWine.name}" by "${correctWine.producer_name}" (${correctWine.vintage})`);
    console.log(`🗑️  Duplicates to delete (${duplicates.length}):`);
    duplicates.forEach(w => {
      console.log(`   - "${w.name}" by "${w.producer_name}" (${w.vintage || 'NV'}) - ID: ${w.id}`);
    });

    if (duplicates.length === 0) {
      return NextResponse.json({
        message: 'No duplicates found. Database is clean!',
        wines
      });
    }

    console.log('\n2️⃣  Deleting duplicates...\n');

    const duplicateIds = duplicates.map(w => w.id);
    const { error: deleteError } = await supabase
      .from('wines')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('❌ Error deleting wines:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`✅ Successfully deleted ${duplicates.length} duplicate wine(s)`);

    // Verify
    console.log('3️⃣  Verifying cleanup...\n');

    const { data: remaining, error: verifyError } = await supabase
      .from('wines')
      .select('id, name, producer_name, vintage')
      .ilike('name', 'the butcher');

    if (verifyError) {
      console.error('Error verifying:', verifyError);
      return NextResponse.json({ error: verifyError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `✅ Cleanup complete! Deleted ${duplicates.length} duplicates.`,
      kept: correctWine,
      deleted: duplicates,
      remaining: remaining || []
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
