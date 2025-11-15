import type { WineEnrichmentInput } from '@/lib/ai/agents/wine-enrichment';

/**
 * Legacy export retained for backwards compatibility.
 * The wine agents now manage their own configuration, so this file simply
 * re-exports the enrichment input shape for scripts that previously pulled
 * types from `config/ai`.
 */
export type WineDescriptionPromptInput = WineEnrichmentInput;
