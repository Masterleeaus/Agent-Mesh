import type { LLMProvider, LLMResponse } from './index';
import type { RuntimeConfig, RuntimeMessage } from '../types';
import { LemmaClient } from 'lemma-sdk';

export class LemmaProvider implements LLMProvider {
  readonly name = 'lemma' as const;

  async execute(messages: RuntimeMessage[], config: RuntimeConfig): Promise<LLMResponse> {
    const podId = process.env.LEMMA_POD_ID || process.env.VITE_LEMMA_POD_ID || '';
    const apiUrl = process.env.LEMMA_API_URL || process.env.VITE_LEMMA_API_URL || 'https://api.lemma.ai';
    const authUrl = process.env.LEMMA_AUTH_URL || process.env.VITE_LEMMA_AUTH_URL || 'https://auth.lemma.ai';

    if (!podId) {
      throw new Error('LEMMA_POD_ID required for Lemma provider');
    }

    const client = new LemmaClient({ podId, apiUrl, authUrl });
    await client.initialize();

    const systemMsg = messages.find(m => m.role === 'system');
    const userMsg = messages.find(m => m.role === 'user');

    const prompt = systemMsg
      ? `${systemMsg.content}\n\n${userMsg?.content || messages.map(m => m.content).join('\n')}`
      : messages.map(m => m.content).join('\n');

    const startTime = Date.now();
    const conv = await client.agents.run(config.agentName, prompt, {
      title: `Runtime: ${config.agentName}`,
    }) as unknown as { id: string };

    const deadline = Date.now() + config.timeout.defaultMs;
    let lastText = '';
    let lastMetadata: Record<string, unknown> = {};

    while (Date.now() < deadline) {
      const res = await client.conversations.messages.list(conv.id);
      const msgs = res.items || [];
      const finalMsgs = [...msgs]
        .reverse()
        .filter((m: any) => m.role === 'assistant')
        .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const final = finalMsgs.find((m: any) => m.metadata?.is_final_answer || m.metadata?.isComplete);
      if (final?.text) {
        lastText = final.text;
        lastMetadata = final.metadata || {};
        break;
      }
      if (finalMsgs.length > 0 && finalMsgs[0]?.text) {
        lastText = finalMsgs[0].text;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    const latencyMs = Date.now() - startTime;
    const inputTokens = messages.reduce((sum, m) => sum + this.countTokens(m.content), 0);
    const outputTokens = this.countTokens(lastText);

    return {
      content: lastText,
      model: config.model || 'lemma',
      usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
      latencyMs,
      finishReason: lastText ? 'stop' : 'timeout',
    };
  }

  countTokens(text: string, _model?: string): number {
    return Math.ceil(text.length / 4);
  }

  estimateCost(inputTokens: number, outputTokens: number, _model?: string): { inputCents: number; outputCents: number; totalCents: number } {
    const rate = { inputPer1K: 0.003, outputPer1K: 0.015 };
    const inputCents = (inputTokens / 1000) * rate.inputPer1K * 100;
    const outputCents = (outputTokens / 1000) * rate.outputPer1K * 100;
    return { inputCents, outputCents, totalCents: inputCents + outputCents };
  }
}
