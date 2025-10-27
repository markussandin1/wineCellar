export interface WineDescriptionPromptInput {
  name: string;
  producerName: string;
  wineType?: string | null;
  vintage?: number | null;
  country?: string | null;
  region?: string | null;
  subRegion?: string | null;
  primaryGrape?: string | null;
  tastingProfileHints?: string | null;
}

export interface WineDescriptionConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  buildUserPrompt: (input: WineDescriptionPromptInput) => string;
}

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Red wine',
  white: 'White wine',
  rose: 'Rosé wine',
  sparkling: 'Sparkling wine',
  dessert: 'Dessert wine',
  fortified: 'Fortified wine',
};

function buildFactsSection(input: WineDescriptionPromptInput): string {
  const facts: string[] = [];

  facts.push(`Wine: ${input.name}`);
  facts.push(`Producer: ${input.producerName}`);

  if (input.wineType) {
    const label = WINE_TYPE_LABELS[input.wineType.toLowerCase()] ?? input.wineType;
    facts.push(`Category: ${label}`);
  }
  if (input.primaryGrape) facts.push(`Grapes: ${input.primaryGrape}`);

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

export const wineDescriptionConfig: WineDescriptionConfig = {
  model: process.env.WINE_DESCRIPTION_MODEL ?? 'gpt-4o-mini',
  temperature: 0.6,
  maxTokens: 700,
  systemPrompt:
    'You are a seasoned sommelier and wine writer. Write with confident, authoritative tone without referencing AI or speculation. Follow established wine journalism standards and keep the prose sensory, concrete, and useful for wine lovers.',
  buildUserPrompt: (input) => {
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
  },
};

export interface LabelScanConfig {
  model: string;
  maxTokens: number;
  prompt: string;
}

export const labelScanConfig: LabelScanConfig = {
  model: 'gpt-4.1-2025-04-14',
  maxTokens: 700,
  prompt: `Analyze this wine label and extract the following information in JSON format:
{
  "wineName": "the wine name (e.g., 'Barolo', 'Chardonnay')",
  "producerName": "the producer/winery name",
  "vintage": "the year (as a number, or null if not visible or NV)",
  "wineType": "one of: red, white, rose, sparkling, dessert, fortified (or null if uncertain)",
  "country": "the country (or null if not visible)",
  "region": "the region (or null if not visible)",
  "subRegion": "the sub-region/appellation (or null if not visible)",
  "primaryGrape": "the primary grape variety (or null if not visible)",
  "estimatedPrice": {
    "amount": "estimated retail price as a number (or null if you cannot estimate)",
    "currency": "the currency code (SEK, USD, EUR, etc.) based on the country/region",
    "confidence": "your confidence in this price estimate as a decimal 0-1",
    "reasoning": "brief explanation of how you estimated the price"
  },
  "confidence": "your overall confidence level as a decimal 0-1"
}

For price estimation, consider:
- Producer reputation and classification (e.g., Grand Cru, Premier Cru, DOC, DOCG)
- Region prestige (e.g., Bordeaux, Burgundy, Barolo, Napa)
- Vintage quality if known
- Typical market prices for similar wines
- Any visible awards or ratings
- Default to the local currency of the wine's origin country

Only return the JSON object, nothing else. Be as accurate as possible.`,
};
