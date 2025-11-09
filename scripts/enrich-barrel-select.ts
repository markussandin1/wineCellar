import { wineEnrichmentAgent } from '../lib/ai/agents/wine-enrichment';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enrichWine() {
  const wineId = 'e6545282-fb82-46af-bac8-5ac0bda7c24e';

  console.log('🍷 Enriching Barrel Select Norton 2024...\n');

  // Generate enrichment
  const result = await wineEnrichmentAgent.execute({
    name: 'Barrel Select',
    producerName: 'Norton',
    wineType: 'red',
    vintage: 2024,
    country: 'Argentina',
    region: 'Mendoza',
    primaryGrape: 'Malbec',
  });

  if (!result.success || !result.data) {
    console.error('❌ Enrichment failed:', result.error);
    process.exit(1);
  }

  const enrichmentData = result.data;
  const aiGeneratedSummary = enrichmentData.summary;
  const fullName = 'Barrel Select Norton 2024';

  console.log('✅ Enrichment generated\n');
  console.log('Summary:', aiGeneratedSummary, '\n');

  // Update wine in database
  console.log('💾 Updating database...\n');

  const { data, error } = await supabase
    .from('wines')
    .update({
      full_name: fullName,
      enrichment_data: enrichmentData,
      enrichment_generated_at: new Date().toISOString(),
      enrichment_version: '2.0.0',
      ai_generated_summary: aiGeneratedSummary,
    })
    .eq('id', wineId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Error updating wine:', error);
    process.exit(1);
  }

  console.log('✅ Wine updated successfully!\n');
  console.log('Full name:', data.full_name);
  console.log('Summary:', data.ai_generated_summary?.substring(0, 100) + '...');
}

enrichWine().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
