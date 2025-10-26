import OpenAI from 'openai';
import { wineDescriptionConfig, type WineDescriptionPromptInput } from '../../config/ai';

interface GeneratedDescriptionPayload {
  summary: string;
  overview: string;
  terroir: string;
  winemaking: string;
  tasting_notes: {
    nose: string;
    palate: string;
    finish: string;
  };
  serving: string;
  food_pairings: string[];
  signature_traits: string;
}

export interface GeneratedWineDescription {
  description: string;
  summary: string;
  raw: GeneratedDescriptionPayload;
}

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OpenAI_API_Key;
  if (!apiKey) {
    console.warn('OpenAI API key not configured. Skipping wine description generation.');
    return null;
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function stripCodeFences(output: string): string {
  let cleaned = output.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

function formatDescription(payload: GeneratedDescriptionPayload): { description: string; summary: string } {
  const lines: string[] = [];

  if (payload.overview) {
    lines.push(payload.overview.trim());
  }

  if (payload.terroir) {
    lines.push('', 'Terroir & Vineyard', payload.terroir.trim());
  }

  if (payload.winemaking) {
    lines.push('', 'Winemaking', payload.winemaking.trim());
  }

  const tastingLines: string[] = [];
  if (payload.tasting_notes?.nose) tastingLines.push(`Aroma: ${payload.tasting_notes.nose.trim()}`);
  if (payload.tasting_notes?.palate) tastingLines.push(`Palate: ${payload.tasting_notes.palate.trim()}`);
  if (payload.tasting_notes?.finish) tastingLines.push(`Finish: ${payload.tasting_notes.finish.trim()}`);
  if (tastingLines.length > 0) {
    lines.push('', 'Tasting Profile', tastingLines.join('\n'));
  }

  if (payload.serving) {
    lines.push('', 'Serving & Cellaring', payload.serving.trim());
  }

  if (Array.isArray(payload.food_pairings) && payload.food_pairings.length > 0) {
    const pairings = payload.food_pairings.map((pairing) => `• ${pairing.trim()}`).join('\n');
    lines.push('', 'Food Pairings', pairings);
  }

  if (payload.signature_traits) {
    lines.push('', 'Signature Traits', payload.signature_traits.trim());
  }

  const description = lines.join('\n').trim();
  const summary = payload.summary?.trim() ?? '';

  return { description, summary };
}

export async function generateWineDescription(
  input: WineDescriptionPromptInput
): Promise<GeneratedWineDescription | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    const userPrompt = wineDescriptionConfig.buildUserPrompt(input);
    const completion = await client.chat.completions.create({
      model: wineDescriptionConfig.model,
      temperature: wineDescriptionConfig.temperature,
      max_tokens: wineDescriptionConfig.maxTokens,
      messages: [
        { role: 'system', content: wineDescriptionConfig.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const messageContent = completion.choices[0]?.message?.content;
    if (!messageContent) {
      console.warn('OpenAI returned empty content for wine description');
      return null;
    }

    const cleaned = stripCodeFences(messageContent);
    const parsed = JSON.parse(cleaned) as GeneratedDescriptionPayload;

    const { description, summary } = formatDescription(parsed);

    if (!description) {
      return null;
    }

    return {
      description,
      summary,
      raw: parsed,
    };
  } catch (error) {
    console.error('Failed to generate wine description', error);
    return null;
  }
}
