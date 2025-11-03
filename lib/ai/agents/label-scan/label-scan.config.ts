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
    model: getModel('LABEL_SCAN_MODEL', 'gpt-4.1-mini'),
    maxTokens: 700,
    timeoutMs: 15000, // 15 seconds for vision API
  }),
  prompt: `Read the text on this wine label and extract the following information in JSON format:
{
  "wineName": "the specific wine/cuvée name (NOT including the producer)",
  "producerName": "the producer/winery/estate name",
  "vintage": "the year as a number if visible, or null if not shown or marked NV",
  "wineType": "one of: red, white, rose, sparkling, dessert, fortified (based on label color, text, or bottle shape)",
  "country": "the country if visible on the label, otherwise null",
  "region": "the region if visible on the label, otherwise null",
  "subRegion": "the sub-region/appellation if visible, otherwise null",
  "primaryGrape": "the grape variety if explicitly shown on the label, otherwise null",
  "confidence": "your confidence level in the extracted data as a decimal 0-1"
}

CRITICAL - Separating Wine Name from Producer Name:
- Producer name: The estate/winery/company name (e.g., "Château Margaux", "Domaine Leflaive", "André Clouet")
- Wine name: The specific wine/cuvée/bottling (e.g., "Reserva", "Barolo", "Brut NV", "Grand Cru")
- DO NOT include the producer name in the wine name
- If only the producer name is visible and no specific wine name, use a generic term like "Champagne", "Red Wine", or the appellation name

Examples:
- Label shows "CHÂTEAU MARGAUX" → producerName: "Château Margaux", wineName: "Margaux"
- Label shows "ANDRÉ CLOUET CHAMPAGNE BRUT" → producerName: "André Clouet", wineName: "Champagne Brut"
- Label shows "BAROLO DOCG" from "Famiglia Anselma" → producerName: "Famiglia Anselma", wineName: "Barolo"

OTHER RULES:
- Only extract text that is VISIBLE on the label - do not infer or guess
- Read the text exactly as written - preserve capitalization and accents
- If information is not clearly visible, set it to null
- For wineType, you may infer from visual cues (label color, bottle shape) if text is unclear
- Do not estimate prices or use external knowledge
- Return only the JSON object, nothing else`,
};
