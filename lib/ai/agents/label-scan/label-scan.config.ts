/**
 * Configuration for Label Scan Agent
 */

import { createAgentConfig, getModel } from '../base';
import type { AgentConfig } from '../base';

/**
 * Label scan agent configuration
 */
export const labelScanConfig: AgentConfig & {
  prompt: string;
} = {
  ...createAgentConfig('label-scan', '2.0.0', {
    model: getModel('LABEL_SCAN_MODEL', 'gpt-5-mini'),
    temperature: 0.1, // Low temperature for factual extraction
    maxTokens: 700,
    timeoutMs: 15000, // 15 seconds for vision API
  }),
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
    "amount": "estimated retail price as a number IN EUROS (or null if you cannot estimate)",
    "currency": "EUR",
    "confidence": "your confidence in this price estimate as a decimal 0-1",
    "reasoning": "brief explanation of how you estimated the price"
  },
  "confidence": "your overall confidence level as a decimal 0-1"
}

IMPORTANT: Always estimate the price in EUR (Euros), regardless of the wine's origin country. EUR is the standard currency for wine pricing globally. Use systembolaget.se for Swedish market prices when applicable.

For price estimation, consider:
- Producer reputation and classification (e.g., Grand Cru, Premier Cru, DOC, DOCG)
- Region prestige (e.g., Bordeaux, Burgundy, Barolo, Napa)
- Vintage quality if known
- Typical market prices for similar wines in Europe
- Any visible awards or ratings

Only return the JSON object, nothing else. Be as accurate as possible.`,
};
