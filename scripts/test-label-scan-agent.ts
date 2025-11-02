/**
 * Test script for Label Scan Agent (V2)
 *
 * Usage:
 *   npm run test:label-scan <path-to-wine-label-image>
 *
 * Example:
 *   npm run test:label-scan ./test-images/barolo.jpg
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { labelScanAgent } from '../lib/ai/agents/label-scan';

// Load environment variables from .env and .env.local
config({ path: '.env' });
config({ path: '.env.local', override: true });

async function testLabelScan(imagePath: string) {
  console.log('🍷 Testing Label Scan Agent V2\n');
  console.log('Image path:', imagePath);
  console.log('---\n');

  try {
    // Read image file
    const absolutePath = resolve(process.cwd(), imagePath);
    console.log('Reading image from:', absolutePath);

    const imageBuffer = readFileSync(absolutePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine MIME type from file extension
    const ext = imagePath.toLowerCase().split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    console.log('Image size:', Math.round(imageBuffer.length / 1024), 'KB');
    console.log('MIME type:', mimeType);
    console.log('\n🔄 Calling OpenAI Vision API...\n');

    // Execute agent
    const startTime = Date.now();
    const result = await labelScanAgent.execute({
      imageBase64: base64Image,
      mimeType,
    });
    const totalTime = Date.now() - startTime;

    // Display results
    console.log('✅ Agent execution completed!\n');
    console.log('📊 Results:');
    console.log('---');
    console.log('Success:', result.success);

    if (result.success && result.data) {
      console.log('\n🍷 Extracted Wine Information:');
      console.log('  Wine Name:', result.data.wineName);
      console.log('  Producer:', result.data.producerName);
      console.log('  Vintage:', result.data.vintage || 'NV');
      console.log('  Wine Type:', result.data.wineType || 'Unknown');
      console.log('  Country:', result.data.country || 'Unknown');
      console.log('  Region:', result.data.region || 'Unknown');
      console.log('  Sub-Region:', result.data.subRegion || 'Unknown');
      console.log('  Primary Grape:', result.data.primaryGrape || 'Unknown');

      console.log('\n💰 Estimated Price:');
      console.log('  Amount:', result.data.estimatedPrice.amount ? `€${result.data.estimatedPrice.amount}` : 'N/A');
      console.log('  Confidence:', Math.round(result.data.estimatedPrice.confidence * 100) + '%');
      console.log('  Reasoning:', result.data.estimatedPrice.reasoning);

      console.log('\n📈 Metadata:');
      console.log('  Overall Confidence:', Math.round((result.confidence || 0) * 100) + '%');
      console.log('  Model:', result.metadata.model);
      console.log('  Tokens Used:', result.metadata.tokensUsed);
      console.log('  API Latency:', result.metadata.latencyMs + 'ms');
      console.log('  Total Time:', totalTime + 'ms');
    } else {
      console.log('\n❌ Error:', result.error);
      console.log('\n📈 Metadata:');
      console.log('  Model:', result.metadata.model);
      console.log('  Latency:', result.metadata.latencyMs + 'ms');
    }

    console.log('\n---');
    console.log('✨ Test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Get image path from command line
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Usage: npm run test:label-scan <path-to-image>');
  console.error('Example: npm run test:label-scan ./test-images/wine-label.jpg');
  process.exit(1);
}

testLabelScan(imagePath);
