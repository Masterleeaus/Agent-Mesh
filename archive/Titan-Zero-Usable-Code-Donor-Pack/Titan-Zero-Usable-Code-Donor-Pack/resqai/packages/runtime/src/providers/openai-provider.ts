import type { LLMProvider, LLMResponse } from './index';
import type { RuntimeConfig, RuntimeMessage } from '../types';

interface OpenAIChoice {
  message?: { content: string };
  finish_reason?: string;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai' as const;

  private get apiKey(): string {
    const key = process.env.OPENAI_API_KEY || process.env.AI_OPENAI_KEY || '';
    if (!key) throw new Error('OPENAI_API_KEY required for OpenAI provider');
    return key;
  }

  private get baseUrl(): string {
    return process.env.AI_OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  async execute(messages: RuntimeMessage[], config: RuntimeConfig): Promise<LLMResponse> {
    const model = config.model || 'gpt-4o';
    const body = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      })),
      max_tokens: config.context.maxTokens,
    };

    const startTime = Date.now();
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeout.defaultMs),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`OpenAI API error ${response.status}: ${errBody}`);
    }

    const data = await response.json() as OpenAIResponse;
    const latencyMs = Date.now() - startTime;
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const finishReason = choice?.finish_reason || 'unknown';

    return {
      content,
      model: data.model || model,
      usage: {
        inputTokens: data.usage?.prompt_tokens || this.countTokens(JSON.stringify(messages)),
        outputTokens: data.usage?.completion_tokens || this.countTokens(content),
        totalTokens: data.usage?.total_tokens || 0,
      },
      latencyMs,
      finishReason,
    };
  }

  countTokens(text: string, model?: string): number {
    if (model?.startsWith('gpt-4') || model?.startsWith('gpt-3')) {
      return Math.ceil(text.length / 4);
    }
    return Math.ceil(text.length / 4);
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): { inputCents: number; outputCents: number; totalCents: number } {
    const key = model || 'gpt-4o';
    const rates: Record<string, { inputPer1K: number; outputPer1K: number }> = {
      'gpt-4o': { inputPer1K: 0.01, outputPer1K: 0.03 },
      'gpt-4o-mini': { inputPer1K: 0.0015, outputPer1K: 0.006 },
      'gpt-4-turbo': { inputPer1K: 0.01, outputPer1K: 0.03 },
      'gpt-3.5-turbo': { inputPer1K: 0.0005, outputPer1K: 0.0015 },
    };
    const rate = rates[key] || rates['gpt-4o'];
    const inputCents = (inputTokens / 1000) * rate.inputPer1K * 100;
    const outputCents = (outputTokens / 1000) * rate.outputPer1K * 100;
    return { inputCents, outputCents, totalCents: inputCents + outputCents };
  }
}
