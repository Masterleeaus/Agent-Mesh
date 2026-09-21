export type EstimateAiRequest = {
  description: string;
  context?: Record<string, unknown>;
};
export type EstimateAiResult<T = unknown> = {
  provider: string;
  model: string;
  output: T;
  generated_at: string;
};
export interface EstimateAiProvider<T = unknown> {
  readonly provider: string;
  readonly model: string;
  generate(request: EstimateAiRequest): Promise<T | null>;
}
export async function runEstimateAi<T>(
  provider: EstimateAiProvider<T>,
  request: EstimateAiRequest,
): Promise<EstimateAiResult<T> | null> {
  const output = await provider.generate(request);
  if (output == null) return null;
  return { provider: provider.provider, model: provider.model, output, generated_at: new Date().toISOString() };
}
