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

  // Check if we're missing critical origin info
  const missingCountry = !input.country;
  const hasRegion = !!input.region;

  return `Write a wine profile based on the following facts:\n${facts}\n\n` +
    'Return a JSON object with the keys:\n' +
    '{\n' +
    '  "summary": "Two sentences introducing the wine\'s style and character",\n' +
    '  "overview": "Short description of the producer\'s approach and where this wine sits in the range",\n' +
    '  "terroir": "Origin, climate, and vineyard factors that shape the wine",\n' +
    '  "winemaking": "Vinification, maturation, and any signature techniques",\n' +
    '  "tastingNotes": {\n' +
    '    "nose": "Aromatic profile with typical scents",\n' +
    '    "palate": "Flavour profile, texture, and balance",\n' +
    '    "finish": "Length, structure, and aftertaste"\n' +
    '  },\n' +
    '  "serving": "Serving guidance, temperature, decanting, and cellaring window if relevant",\n' +
    '  "foodPairings": ["Three to four dishes or food styles with brief justification"],\n' +
    '  "signatureTraits": "What makes the wine distinctive or memorable",\n' +
    '  "inferredCountry": "The country of origin (ONLY if you can determine it with high confidence from producer name, region, or other facts)",\n' +
    '  "inferredRegion": "The wine region (ONLY if you can determine it with high confidence from producer name or other facts)"\n' +
    '}\n\n' +
    'CRITICAL REQUIREMENTS:\n' +
    (missingCountry && hasRegion
      ? `- IMPORTANT: Country is missing but region "${input.region}" is provided. Use your wine knowledge to determine the country for this region with high confidence. Add it to "inferredCountry".\n`
      : '') +
    (missingCountry && !hasRegion
      ? '- IMPORTANT: Country and region are missing. Analyze the producer name, wine name, and grape variety to determine the likely country/region. Add confident inferences to "inferredCountry" and "inferredRegion".\n'
      : '') +
    '- Use established wine knowledge to infer geographic origin when facts strongly indicate it (e.g., "Central Coast" → USA, "Barossa" → Australia).\n' +
    '- Base descriptions on the wine type, grape variety, and any provided origin information.\n' +
    '- Write in complete sentences, third person. Maintain a confident, expert tone.\n' +
    '- Do not mention AI, uncertainty, or gaps in data.\n' +
    '- If you cannot determine country/region with high confidence, set inferredCountry and inferredRegion to null.\n';
}

/**
 * Build comprehensive review prompt that suggests improvements to ALL fields
 */
function buildComprehensiveReviewPrompt(input: WineEnrichmentInput): string {
  const facts = buildFactsSection(input);

  return `Review and improve the following wine data. Suggest corrections/improvements to ALL fields based on your wine knowledge:\n${facts}\n\n` +
    'Return a JSON object with suggested data for ALL fields:\n' +
    '{\n' +
    '  "basicData": {\n' +
    '    "name": "Corrected/improved wine name (formal style, e.g., \'Pinot Noir\' not \'pinot noir\')",\n' +
    '    "producerName": "Corrected/improved producer name (proper capitalization and formatting)",\n' +
    '    "wineType": "Corrected wine type: red, white, rose, sparkling, dessert, or fortified (or null if unknown)",\n' +
    '    "vintage": Corrected vintage year as number (or null if NV/unknown),\n' +
    '    "primaryGrape": "Corrected primary grape variety (proper capitalization, e.g., \'Cabernet Sauvignon\')",\n' +
    '    "alcoholContent": Suggested alcohol % as number (or null if unknown),\n' +
    '    "sweetnessLevel": "Suggested sweetness: dry, off_dry, medium, sweet, or very_sweet (or null)",\n' +
    '    "body": "Suggested body: light, medium, or full (or null)"\n' +
    '  },\n' +
    '  "locationData": {\n' +
    '    "country": "Corrected country (or null if uncertain)",\n' +
    '    "region": "Corrected region (or null if uncertain)",\n' +
    '    "subRegion": "Corrected sub-region (or null if uncertain)",\n' +
    '    "appellation": "Suggested official appellation/AOC/AVA/DOC (or null if none)"\n' +
    '  },\n' +
    '  "enrichmentData": {\n' +
    '    "summary": "Two sentences introducing the wine\'s style and character",\n' +
    '    "overview": "Short description of the producer\'s approach and where this wine sits in the range",\n' +
    '    "terroir": "Origin, climate, and vineyard factors that shape the wine",\n' +
    '    "winemaking": "Vinification, maturation, and any signature techniques",\n' +
    '    "tastingNotes": {\n' +
    '      "nose": "Aromatic profile with typical scents",\n' +
    '      "palate": "Flavour profile, texture, and balance",\n' +
    '      "finish": "Length, structure, and aftertaste"\n' +
    '    },\n' +
    '    "serving": "Serving guidance, temperature, decanting, and cellaring window if relevant",\n' +
    '    "foodPairings": ["Three to four dishes or food styles with brief justification"],\n' +
    '    "signatureTraits": "What makes the wine distinctive or memorable"\n' +
    '  }\n' +
    '}\n\n' +
    'CRITICAL REQUIREMENTS:\n' +
    '- Use your wine knowledge to suggest corrections to name, producer, grape variety (proper capitalization, formatting)\n' +
    '- Infer missing data (alcohol, sweetness, body) based on wine type, grape, and region\n' +
    '- Correct any misspellings or formatting issues\n' +
    '- If country/region are missing, use producer name and wine style to infer them\n' +
    '- Only set fields to null if you truly cannot determine the value\n' +
    '- Write enrichment in complete sentences, third person, expert tone\n' +
    '- Do not mention AI, uncertainty, or gaps in data\n';
}

/**
 * Wine enrichment agent configuration
 */
const baseConfig = createAgentConfig('wine-enrichment', '2.0.0', {
  model: getModel('WINE_ENRICHMENT_MODEL', 'gpt-4.1-mini'),
  temperature: 0.2,
  maxTokens: 1200, // Increased for comprehensive review
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
  buildComprehensiveReviewPrompt,
};
