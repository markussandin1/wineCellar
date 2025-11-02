/**
 * Orchestration utilities for executing multiple agents
 */

import type { AgentResult } from './agent.types';

/**
 * Execute multiple agents in parallel
 */
export async function executeParallel<T extends Record<string, any>>(
  agents: Record<keyof T, () => Promise<AgentResult<any>>>
): Promise<Record<keyof T, AgentResult<any>>> {
  const entries = Object.entries(agents) as [keyof T, () => Promise<AgentResult<any>>][];

  const results = await Promise.all(
    entries.map(async ([key, executor]) => {
      try {
        const result = await executor();
        return [key, result] as const;
      } catch (error) {
        // If agent throws, wrap in failed result
        return [
          key,
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              model: 'unknown',
              tokensUsed: 0,
              latencyMs: 0,
              timestamp: new Date(),
            },
          },
        ] as const;
      }
    })
  );

  return Object.fromEntries(results) as Record<keyof T, AgentResult<any>>;
}

/**
 * Execute agents sequentially (if one depends on another)
 */
export async function executeSequential<T>(
  executors: Array<() => Promise<AgentResult<T>>>
): Promise<AgentResult<T>[]> {
  const results: AgentResult<T>[] = [];

  for (const executor of executors) {
    try {
      const result = await executor();
      results.push(result);

      // Stop on first failure if needed
      if (!result.success) {
        break;
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model: 'unknown',
          tokensUsed: 0,
          latencyMs: 0,
          timestamp: new Date(),
        },
      });
      break;
    }
  }

  return results;
}

/**
 * Merge multiple agent results into a summary
 */
export function mergeResults<T extends Record<string, AgentResult<any>>>(
  results: T
): {
  allSucceeded: boolean;
  anySucceeded: boolean;
  errors: string[];
  totalTokens: number;
  totalLatencyMs: number;
} {
  const values = Object.values(results);

  return {
    allSucceeded: values.every(r => r.success),
    anySucceeded: values.some(r => r.success),
    errors: values.filter(r => !r.success).map(r => r.error || 'Unknown error'),
    totalTokens: values.reduce((sum, r) => sum + r.metadata.tokensUsed, 0),
    totalLatencyMs: Math.max(...values.map(r => r.metadata.latencyMs)),
  };
}
