import 'dotenv/config';
import path from 'path';
// Load Prisma client from project root to keep relative path stable after compilation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require(path.join(process.cwd(), 'lib/generated/prisma'));
import { generateWineDescription } from '../lib/ai/wine-description';

const prisma = new PrismaClient();

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

type WineRecord = Awaited<ReturnType<typeof prisma.wine.findFirst>>;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processWine(wine: NonNullable<WineRecord>) {
  console.log(`\nProcessing ${wine.id} — ${wine.producerName} ${wine.name}`);

  const generated = await generateWineDescription({
    name: wine.name,
    producerName: wine.producerName,
    wineType: wine.wineType ?? undefined,
    vintage: wine.vintage ?? undefined,
    country: wine.country ?? undefined,
    region: wine.region ?? undefined,
    subRegion: wine.subRegion ?? undefined,
    primaryGrape: wine.primaryGrape ?? undefined,
  });

  if (!generated) {
    console.warn('No description generated; skipping update');
    return false;
  }

  if (dryRun) {
    console.log('Dry run — generated text preview:');
    console.log(generated.description.substring(0, 200).trim() + (generated.description.length > 200 ? '…' : ''));
    return false;
  }

  await prisma.wine.update({
    where: { id: wine.id },
    data: {
      description: generated.description,
      aiGeneratedSummary: generated.summary,
    },
  });

  return true;
}

async function main() {
  if (!process.env.OPENAI_API_KEY && !process.env.OpenAI_API_Key) {
    console.error('Missing OpenAI API key in environment. Aborting.');
    process.exit(1);
  }

  console.log('Starting wine description backfill');
  console.log(`Options → batch: ${batchSize}, delay: ${delayMs}ms, dryRun: ${dryRun}`);
  if (maxToProcess) {
    console.log(`Will stop after ${maxToProcess} wines`);
  }

  let processed = 0;
  let updated = 0;

  while (true) {
    const remaining = maxToProcess ? Math.max(maxToProcess - processed, 0) : batchSize;
    if (maxToProcess && remaining === 0) {
      break;
    }

    const take = maxToProcess ? Math.min(batchSize, remaining) : batchSize;

    const wines = await prisma.wine.findMany({
      where: {
        OR: [
          { description: null },
          { description: '' },
          { aiGeneratedSummary: null },
          { aiGeneratedSummary: '' },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take,
    });

    if (wines.length === 0) {
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
  }

  console.log(`\nDone. Processed ${processed} wines; updated ${updated}.`);
}

main()
  .catch((error) => {
    console.error('Backfill failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
