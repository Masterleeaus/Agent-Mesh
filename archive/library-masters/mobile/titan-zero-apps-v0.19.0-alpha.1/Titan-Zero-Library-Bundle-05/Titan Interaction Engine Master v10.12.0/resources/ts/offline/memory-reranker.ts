import { PersonaSignalAnalyzer } from './persona-drift';

export interface MemoryCandidate {
  id: string;
  content: string;
  semanticSimilarity?: number;
  timestamp?: string;
  emotionalIntensity?: number;
  factKey?: string;
  factValue?: unknown;
  [key: string]: unknown;
}

export interface ScoredMemory extends MemoryCandidate {
  semanticScore: number;
  recencyScore: number;
  emotionalScore: number;
  score: number;
}

export interface MemoryRanking {
  mostRelevant: ScoredMemory;
  contradictions: ScoredMemory[];
  alternatives: ScoredMemory[];
  weights: { semantic: number; recency: number; emotion: number };
}

export class WeightedMemoryReranker {
  private readonly analyzer = new PersonaSignalAnalyzer();

  public constructor(
    private readonly semanticWeight = 0.4,
    private readonly recencyWeight = 0.4,
    private readonly emotionWeight = 0.2,
  ) {
    if (Math.abs(semanticWeight + recencyWeight + emotionWeight - 1) > 0.0001) throw new Error('Memory reranker weights must sum to 1.0.');
  }

  rank(candidates: MemoryCandidate[], now = new Date(), limit = 5): MemoryRanking {
    const scored = candidates.filter((candidate) => candidate.content.trim().length > 0).map((candidate) => {
      const semanticScore = clamp(candidate.semanticSimilarity ?? 0);
      const timestamp = candidate.timestamp ? new Date(candidate.timestamp) : now;
      const validTimestamp = Number.isNaN(timestamp.getTime()) ? now : timestamp;
      const daysOld = Math.max(0, (now.getTime() - validTimestamp.getTime()) / 86_400_000);
      const recencyScore = 1 / (daysOld + 1);
      const emotionalScore = clamp(candidate.emotionalIntensity ?? this.analyzer.analyze(candidate.content).emotionalIntensity);
      return {
        ...candidate,
        semanticScore: round(semanticScore),
        recencyScore: round(recencyScore),
        emotionalScore: round(emotionalScore),
        score: round(semanticScore * this.semanticWeight + recencyScore * this.recencyWeight + emotionalScore * this.emotionWeight),
      } satisfies ScoredMemory;
    }).sort((left, right) => right.score - left.score || String(right.timestamp ?? '').localeCompare(String(left.timestamp ?? '')) || left.id.localeCompare(right.id)).slice(0, Math.max(1, limit));

    const best = scored[0];
    if (best === undefined) throw new Error('At least one non-empty memory candidate is required.');
    const contradictions: ScoredMemory[] = [];
    const alternatives: ScoredMemory[] = [];
    for (const candidate of scored.slice(1)) {
      if (best.factKey && candidate.factKey === best.factKey && best.factValue !== undefined && candidate.factValue !== undefined && candidate.factValue !== best.factValue) contradictions.push(candidate);
      else alternatives.push(candidate);
    }
    return { mostRelevant: best, contradictions, alternatives, weights: { semantic: this.semanticWeight, recency: this.recencyWeight, emotion: this.emotionWeight } };
  }
}

function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }
function round(value: number): number { return Math.round(value * 10_000) / 10_000; }
