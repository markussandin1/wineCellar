import 'dotenv/config';
import { generateWineDescription } from '../lib/ai/wine-description';
import { getSupabaseAdmin } from '../lib/supabase';

const supabase = getSupabaseAdmin();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchArg = args.find((arg) => arg.startsWith('--batch='));
const delayArg = args.find((arg) => arg.startsWith('--delay='));
const maxArg = args.find((arg) => arg.startsWith('--max='));

const batchSize = batchArg ? Number.parseInt(batchArg.split('=')[1], 10) : 10;
const delayMs = delayArg ? Number.parseInt(delayArg.split('=')[1], 10) : 1500;
const maxToProcess = maxArg ? Number.parseInt(maxArg.split('=')[1], 10) : null;

if (Number.isNaN(batchSize) || batchSize <= 0) {
  throw new Error('Invalid --batch value; expected positive integer');
}

if (Number.isNaN(delayMs) || delayMs < 0) {
  throw new Error('Invalid --delay value; expected non-negative integer');
}

if (maxToProcess !== null && (Number.isNaN(maxToProcess) || maxToProcess <= 0)) {
  throw new Error('Invalid --max value; expected positive integer');
}

interface WineRow {
  id: string;
  name: string;
  producer_name: string;
  wine_type: string | null;
  vintage: number | null;
  country: string | null;
  region: string | null;
  sub_region: string | null;
  primary_grape: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBatch(offset: number, limit: number) {
  const { data, error } = await supabase
    .from('wines')
    .select(
      `id,name,producer_name,wine_type,vintage,country,region,sub_region,primary_grape`
    )
    .is('enrichment_data', null)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data as WineRow[] | null;
}

async function processWine(wine: WineRow) {
  console.log(`\nProcessing ${wine.id} — ${wine.producer_name} ${wine.name}`);

  const generated = await generateWineDescription({
    name: wine.name,
    producerName: wine.producer_name,
    wineType: wine.wine_type ?? undefined,
    vintage: wine.vintage ?? undefined,
    country: wine.country ?? undefined,
    region: wine.region ?? undefined,
    subRegion: wine.sub_region ?? undefined,
    primaryGrape: wine.primary_grape ?? undefined,
  });

  if (!generated) {
    console.warn('No enrichment generated; skipping update');
    return false;
  }

  if (dryRun) {
    console.log('Dry run — generated summary:', generated.summary);
    return false;
  }

  const { error } = await supabase
    .from('wines')
    .update({
      description: generated.description,
      ai_generated_summary: generated.summary,
      enrichment_data: generated.enrichmentData,
      enrichment_generated_at: new Date().toISOString(),
      enrichment_version: '2.0.0',
    })
    .eq('id', wine.id);

  if (error) {
    console.error('Failed to update wine:', error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('Starting wine enrichment backfill');
  console.log(`Options → batch: ${batchSize}, delay: ${delayMs}ms, dryRun: ${dryRun}`);
  if (maxToProcess) {
    console.log(`Will stop after ${maxToProcess} wines`);
  }

  let processed = 0;
  let updated = 0;
  let offset = 0;

  while (true) {
    const remaining = maxToProcess ? Math.max(maxToProcess - processed, 0) : batchSize;
    if (maxToProcess && remaining === 0) {
      break;
    }

    const take = maxToProcess ? Math.min(batchSize, remaining) : batchSize;
    const wines = await fetchBatch(offset, take);

    if (!wines || wines.length === 0) {
      break;
    }

    for (const wine of wines) {
      processed += 1;
      const didUpdate = await processWine(wine);
      if (didUpdate) {
        updated += 1;
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }

      if (maxToProcess && processed >= maxToProcess) {
        break;
      }
    }

    offset += wines.length;
  }

  console.log(`\nDone. Processed ${processed} wines; updated ${updated}.`);
}

main().catch((error) => {
  console.error('Backfill failed', error);
  process.exitCode = 1;
});
