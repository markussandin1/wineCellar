/**
 * Base types for the AI Agent system
 * All agents implement these core interfaces
 */

/**
 * Metadata about agent execution
 */
export interface AgentMetadata {
  /** The model used for this execution */
  model: string;
  /** Total tokens consumed (prompt + completion) */
  tokensUsed: number;
  /** Execution time in milliseconds */
  latencyMs: number;
  /** Timestamp when execution started */
  timestamp: Date;
}

/**
 * Result returned by agent execution
 */
export interface AgentResult<T> {
  /** Whether the agent execution was successful */
  success: boolean;
  /** The data returned by the agent (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Confidence level in the result (0-1) */
  confidence?: number;
  /** Execution metadata */
  metadata: AgentMetadata;
}

/**
 * Base interface that all agents must implement
 */
export interface Agent<TInput, TOutput> {
  /** Agent name (e.g., 'label-scan') */
  name: string;
  /** Agent version (semantic versioning) */
  version: string;
  /** Execute the agent with given input */
  execute(input: TInput): Promise<AgentResult<TOutput>>;
}

/**
 * Configuration for an agent
 */
export interface AgentConfig {
  /** Agent name */
  name: string;
  /** Agent version */
  version: string;
  /** OpenAI model to use */
  model: string;
  /** Temperature for generation (0-1) */
  temperature: number;
  /** Maximum tokens to generate */
  maxTokens: number;
  /** Timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Error thrown by agents
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly agentName: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AgentError';
  }
}
