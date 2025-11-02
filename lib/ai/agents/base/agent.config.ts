/**
 * Shared configuration utilities for agents
 */

import type { AgentConfig } from './agent.types';

/**
 * Get model name from environment or use default
 */
export function getModel(envKey: string, defaultModel: string): string {
  return process.env[envKey] || defaultModel;
}

/**
 * Get OpenAI API key from environment
 */
export function getOpenAIKey(): string | null {
  return process.env.OPENAI_API_KEY || process.env.OpenAI_API_Key || null;
}

/**
 * Create agent config with defaults
 */
export function createAgentConfig(
  name: string,
  version: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  } = {}
): AgentConfig {
  return {
    name,
    version,
    model: options.model || 'gpt-5-mini',
    temperature: options.temperature ?? 0.2,
    maxTokens: options.maxTokens || 500,
    timeoutMs: options.timeoutMs || 30000,
  };
}

/**
 * Validate that OpenAI API key is configured
 */
export function validateOpenAIKey(): void {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error(
      'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.'
    );
  }
}

/**
 * Strip markdown code fences from LLM output
 */
export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Extract text from OpenAI Responses API output
 */
export function extractOutputText(response: any): string {
  // Handle direct output_text field
  if (typeof response?.output_text === 'string' && response.output_text.trim().length > 0) {
    return response.output_text;
  }

  // Handle structured output array
  if (Array.isArray(response?.output)) {
    const parts: string[] = [];
    for (const item of response.output) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const piece of item.content) {
          if (piece.type === 'output_text') {
            parts.push(piece.text ?? '');
          }
        }
      }
    }
    const combined = parts.join('').trim();
    if (combined.length > 0) {
      return combined;
    }
  }

  return '';
}
