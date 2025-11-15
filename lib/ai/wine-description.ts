import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';
import type {
  WineEnrichmentInput,
  WineEnrichmentOutput,
} from '@/lib/ai/agents/wine-enrichment';

export interface GeneratedWineDescription {
  description: string;
  summary: string;
  enrichmentData: WineEnrichmentOutput;
}

function formatDescription(enrichment: WineEnrichmentOutput): string {
  const lines: string[] = [];

  if (enrichment.overview) {
    lines.push(enrichment.overview.trim());
  }

  if (enrichment.terroir) {
    lines.push('', 'Terroir & Vineyard', enrichment.terroir.trim());
  }

  if (enrichment.winemaking) {
    lines.push('', 'Winemaking', enrichment.winemaking.trim());
  }

  const tastingLines: string[] = [];
  if (enrichment.tastingNotes?.nose) {
    tastingLines.push(`Aroma: ${enrichment.tastingNotes.nose.trim()}`);
  }
  if (enrichment.tastingNotes?.palate) {
    tastingLines.push(`Palate: ${enrichment.tastingNotes.palate.trim()}`);
  }
  if (enrichment.tastingNotes?.finish) {
    tastingLines.push(`Finish: ${enrichment.tastingNotes.finish.trim()}`);
  }
  if (tastingLines.length > 0) {
    lines.push('', 'Tasting Profile', tastingLines.join('\n'));
  }

  if (enrichment.serving) {
    lines.push('', 'Serving & Cellaring', enrichment.serving.trim());
  }

  if (Array.isArray(enrichment.foodPairings) && enrichment.foodPairings.length > 0) {
    const pairings = enrichment.foodPairings
      .filter((pairing) => pairing && pairing.trim().length > 0)
      .map((pairing) => `• ${pairing.trim()}`)
      .join('\n');

    if (pairings) {
      lines.push('', 'Food Pairings', pairings);
    }
  }

  if (enrichment.signatureTraits) {
    lines.push('', 'Signature Traits', enrichment.signatureTraits.trim());
  }

  return lines.join('\n').trim();
}

export async function generateWineDescription(
  input: WineEnrichmentInput
): Promise<GeneratedWineDescription | null> {
  try {
    const result = await wineEnrichmentAgent.execute(input);

    if (!result.success || !result.data) {
      console.warn('Wine enrichment agent returned no data:', result.error);
      return null;
    }

    const enrichmentData = result.data;
    const description = formatDescription(enrichmentData);

    return {
      description,
      summary: enrichmentData.summary,
      enrichmentData,
    };
  } catch (error) {
    console.error('Failed to generate wine enrichment', error);
    return null;
  }
}

export function buildDescriptionFromEnrichment(enrichment: WineEnrichmentOutput | null | undefined): string | null {
  if (!enrichment) {
    return null;
  }

  const formatted = formatDescription(enrichment);
  return formatted.length > 0 ? formatted : null;
}
