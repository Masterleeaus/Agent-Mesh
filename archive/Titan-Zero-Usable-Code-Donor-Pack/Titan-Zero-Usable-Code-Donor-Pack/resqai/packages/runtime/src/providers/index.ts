import type { ModelProvider, RuntimeConfig, RuntimeMessage } from '../types';
import { LemmaProvider } from './lemma-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';

export interface LLMProvider {
  readonly name: ModelProvider;
  execute(messages: RuntimeMessage[], config: RuntimeConfig): Promise<LLMResponse>;
  countTokens(text: string, model?: string): number;
  estimateCost(inputTokens: number, outputTokens: number, model?: string): { inputCents: number; outputCents: number; totalCents: number };
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason: string;
}

const providerRegistry = new Map<ModelProvider, () => LLMProvider>();

export function registerProvider(name: ModelProvider, factory: () => LLMProvider): void {
  providerRegistry.set(name, factory);
}

export function getProvider(name: ModelProvider): LLMProvider {
  const factory = providerRegistry.get(name);
  if (!factory) {
    throw new Error(`No provider registered for "${name}". Available: ${[...providerRegistry.keys()].join(', ')}`);
  }
  return factory();
}

export function getDefaultProvider(config: RuntimeConfig): LLMProvider {
  return getProvider(config.provider);
}

registerProvider('lemma', () => new LemmaProvider());
registerProvider('openai', () => new OpenAIProvider());
registerProvider('anthropic', () => new AnthropicProvider());
