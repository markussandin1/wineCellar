import type { WineEnrichmentOutput } from '@/lib/ai/agents/wine-enrichment/wine-enrichment.types';

export type WineProfileEnrichment = Partial<WineEnrichmentOutput> & {
  tastingNotes?: Partial<WineEnrichmentOutput['tastingNotes']> | null;
  foodPairings?: string[] | null;
};

export type DescriptionBlock =
  | { type: 'paragraph'; body: string }
  | { type: 'section'; title: string; body: string }
  | { type: 'list'; title: string; items: string[] };

export const hasText = (value?: string | null) => Boolean(value && value.trim().length > 0);

export function parseDescription(description?: string | null): DescriptionBlock[] {
  if (!hasText(description)) return [];

  return (description as string)
    .split('\n\n')
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      if (lines.length === 1) {
        return { type: 'paragraph', body: lines[0] };
      }

      const [heading, ...rest] = lines;
      const listItems = rest
        .filter((line) => line.startsWith('• '))
        .map((line) => line.replace(/^•\s*/, ''));

      if (listItems.length === rest.length && listItems.length > 0) {
        return { type: 'list', title: heading, items: listItems };
      }

      return { type: 'section', title: heading, body: rest.join('\n') };
    });
}
