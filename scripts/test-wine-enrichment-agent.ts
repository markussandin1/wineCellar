/**
 * Test script for Wine Enrichment Agent V2
 *
 * Usage:
 *   npx tsx scripts/test-wine-enrichment-agent.ts
 */

import dotenv from 'dotenv';
import { wineEnrichmentAgent } from '../lib/ai/agents/wine-enrichment';
import type { WineEnrichmentInput } from '../lib/ai/agents/wine-enrichment';

// Load environment variables
dotenv.config({ path: '.env' });

/**
 * Test cases for wine enrichment
 */
const testCases: Array<{ name: string; input: WineEnrichmentInput }> = [
  {
    name: 'Bordeaux Red with full details',
    input: {
      name: 'Château Margaux',
      producerName: 'Château Margaux',
      wineType: 'red',
      vintage: 2015,
      country: 'France',
      region: 'Bordeaux',
      subRegion: 'Margaux',
      primaryGrape: 'Cabernet Sauvignon',
      tastingProfileHints: 'Elegant, powerful, long aging potential',
    },
  },
  {
    name: 'Simple Italian White',
    input: {
      name: 'Pinot Grigio',
      producerName: 'Santa Margherita',
      wineType: 'white',
      country: 'Italy',
      region: 'Alto Adige',
    },
  },
  {
    name: 'Champagne with minimal info',
    input: {
      name: 'Brut Reserve',
      producerName: 'Taittinger',
      wineType: 'sparkling',
      country: 'France',
      region: 'Champagne',
    },
  },
  {
    name: 'New World wine',
    input: {
      name: 'Catena Zapata Malbec',
      producerName: 'Catena Zapata',
      wineType: 'red',
      vintage: 2020,
      country: 'Argentina',
      region: 'Mendoza',
      primaryGrape: 'Malbec',
    },
  },
];

/**
 * Format output for readability
 */
function formatOutput(result: any): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 SUMMARY
${result.summary}

📖 OVERVIEW
${result.overview}

🌍 TERROIR
${result.terroir}

🍷 WINEMAKING
${result.winemaking}

👃 TASTING NOTES

Nose: ${result.tastingNotes.nose}

Palate: ${result.tastingNotes.palate}

Finish: ${result.tastingNotes.finish}

🍽️ FOOD PAIRINGS
${result.foodPairings.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

✨ SIGNATURE TRAITS
${result.signatureTraits}

🥂 SERVING
${result.serving}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Run test
 */
async function runTest(testCase: { name: string; input: WineEnrichmentInput }) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log('━'.repeat(60));

  const startTime = Date.now();

  try {
    const result = await wineEnrichmentAgent.execute(testCase.input);
    const duration = Date.now() - startTime;

    if (result.success && result.data) {
      console.log(`✅ Success (${duration}ms)`);
      console.log(formatOutput(result.data));
    } else {
      console.error(`❌ Failed (${duration}ms)`);
      console.error('Error:', result.error || 'Unknown error');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed (${duration}ms)`);
    console.error('Error:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🍷 Wine Enrichment Agent V2 Test Suite');
  console.log('═'.repeat(60));

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.error('Please add it to your .env file');
    process.exit(1);
  }

  // Run all test cases
  for (const testCase of testCases) {
    await runTest(testCase);
  }

  console.log('\n✨ All tests completed!');
}

// Run the tests
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
