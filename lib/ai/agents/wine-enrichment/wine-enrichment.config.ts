/**
 * Configuration for Wine Enrichment Agent
 */

import { createAgentConfig, getModel } from '../base';
import type { AgentConfig } from '../base';
import type { WineEnrichmentInput } from './wine-enrichment.types';

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Red wine',
  white: 'White wine',
  rose: 'Rosé wine',
  sparkling: 'Sparkling wine',
  dessert: 'Dessert wine',
  fortified: 'Fortified wine',
};

/**
 * Build facts section for the prompt
 */
function buildFactsSection(input: WineEnrichmentInput): string {
  const facts: string[] = [];

  facts.push(`Wine: ${input.name}`);
  facts.push(`Producer: ${input.producerName}`);

  if (input.wineType) {
    const label = WINE_TYPE_LABELS[input.wineType.toLowerCase()] ?? input.wineType;
    facts.push(`Category: ${label}`);
  }
  if (input.primaryGrape) {
    facts.push(`Grapes: ${input.primaryGrape}`);
  }

  const originParts = [input.country, input.region, input.subRegion].filter(Boolean);
  if (originParts.length > 0) {
    facts.push(`Origin: ${originParts.join(' • ')}`);
  }

  if (typeof input.vintage === 'number') {
    facts.push(`Vintage: ${input.vintage}`);
  }

  if (input.tastingProfileHints) {
    facts.push(`Additional notes: ${input.tastingProfileHints}`);
  }

  return facts.join('\n');
}

/**
 * Build user prompt from input
 */
function buildUserPrompt(input: WineEnrichmentInput): string {
  const facts = buildFactsSection(input);

  return `Write an English wine profile based on the following facts:\n${facts}\n\n` +
    'Return a JSON object with the keys:\n' +
    '{\n' +
    '  "summary": "Two sentences introducing the wine\'s style and character",\n' +
    '  "overview": "Short description of the producer\'s approach and where this wine sits in the range",\n' +
    '  "terroir": "Origin, climate, and vineyard factors that shape the wine",\n' +
    '  "winemaking": "Vinification, maturation, and any signature techniques",\n' +
    '  "tasting_notes": {\n' +
    '    "nose": "Aromatic profile with typical scents",\n' +
    '    "palate": "Flavour profile, texture, and balance",\n' +
    '    "finish": "Length, structure, and aftertaste"\n' +
    '  },\n' +
    '  "serving": "Serving guidance, temperature, decanting, and cellaring window if relevant",\n' +
    '  "food_pairings": ["Three to four dishes or food styles with brief justification"],\n' +
    '  "signature_traits": "What makes the wine distinctive or memorable"\n' +
    '}\n\n' +
    'Requirements:\n' +
    '- Use only details that can be derived from the facts or widely recognised traits for the style/region.\n' +
    '- If data is missing, rely on established characteristics without calling out gaps or uncertainty.\n' +
    '- Write in complete sentences, third person, and avoid bullet lists except inside the food_pairings array.\n' +
    '- Do not mention AI, guesses, or hedging language. Maintain a confident, expert tone.\n';
}

/**
 * Wine enrichment agent configuration
 */
const baseConfig = createAgentConfig('wine-enrichment', '2.0.0', {
  model: getModel('WINE_ENRICHMENT_MODEL', 'gpt-4.1-mini'),
  temperature: 0.2,
  maxTokens: 800,
  timeoutMs: 20000,
});

export const wineEnrichmentConfig = {
  name: baseConfig.name,
  version: baseConfig.version,
  model: baseConfig.model,
  temperature: baseConfig.temperature,
  maxTokens: baseConfig.maxTokens,
  timeoutMs: baseConfig.timeoutMs,
  systemPrompt:
    'You are a seasoned sommelier and wine writer. Write with confident, authoritative tone without referencing AI or speculation. Follow established wine journalism standards and keep the prose sensory, concrete, and useful for wine lovers.',
  buildUserPrompt,
};
