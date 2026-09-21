import type { LLMProvider, LLMResponse } from './index';
import type { RuntimeConfig, RuntimeMessage } from '../types';

interface AnthropicContent {
  text: string;
  type?: string;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  content: AnthropicContent[];
  model: string;
  usage: AnthropicUsage;
  stop_reason?: string;
  stop_sequence?: string | null;
}

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;

  private get apiKey(): string {
    const key = process.env.ANTHROPIC_API_KEY || process.env.AI_ANTHROPIC_KEY || '';
    if (!key) throw new Error('ANTHROPIC_API_KEY required for Anthropic provider');
    return key;
  }

  private get baseUrl(): string {
    return process.env.AI_ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
  }

  async execute(messages: RuntimeMessage[], config: RuntimeConfig): Promise<LLMResponse> {
    const model = config.model || 'claude-3.5-sonnet';
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      max_tokens: Math.min(config.context.maxTokens, 8192),
      messages: nonSystem.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };
    if (systemMsg) {
      body.system = systemMsg.content;
    }

    const startTime = Date.now();
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeout.defaultMs),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
    }

    const data = await response.json() as AnthropicResponse;
    const latencyMs = Date.now() - startTime;
    const content = data.content?.map(c => c.text).join('\n') || '';
    const finishReason = data.stop_reason || data.stop_sequence || 'unknown';

    return {
      content,
      model: data.model || model,
      usage: {
        inputTokens: data.usage?.input_tokens || this.countTokens(JSON.stringify(messages)),
        outputTokens: data.usage?.output_tokens || this.countTokens(content),
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      latencyMs,
      finishReason,
    };
  }

  countTokens(text: string, _model?: string): number {
    return Math.ceil(text.length / 3.5);
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): { inputCents: number; outputCents: number; totalCents: number } {
    const key = model || 'claude-3.5-sonnet';
    const rates: Record<string, { inputPer1K: number; outputPer1K: number }> = {
      'claude-3.5-sonnet': { inputPer1K: 0.003, outputPer1K: 0.015 },
      'claude-3-opus': { inputPer1K: 0.015, outputPer1K: 0.075 },
      'claude-3-haiku': { inputPer1K: 0.00025, outputPer1K: 0.00125 },
    };
    const rate = rates[key] || rates['claude-3.5-sonnet'];
    const inputCents = (inputTokens / 1000) * rate.inputPer1K * 100;
    const outputCents = (outputTokens / 1000) * rate.outputPer1K * 100;
    return { inputCents, outputCents, totalCents: inputCents + outputCents };
  }
}
