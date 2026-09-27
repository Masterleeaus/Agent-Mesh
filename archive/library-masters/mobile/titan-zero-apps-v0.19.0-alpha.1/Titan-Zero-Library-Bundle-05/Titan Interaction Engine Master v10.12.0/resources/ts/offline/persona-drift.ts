export interface PersonaMetrics {
  sentimentPolarity: number;
  formality: number;
  emotionalIntensity: number;
  label: string;
}

export interface PersonaDriftObservation {
  observedAt: string;
  metrics: PersonaMetrics;
  baseline: { sentimentPolarity: number; formality: number } | null;
  deltas: { sentiment: number; formality: number };
  driftScore: number;
  driftEvent: boolean;
  triggers: string[];
  model: 'adaptive-persona-v2';
}

const positive = new Set(['good', 'great', 'excellent', 'happy', 'pleased', 'appreciate', 'love', 'wonderful', 'awesome', 'perfect', 'satisfied', 'excited', 'calm', 'helpful', 'thanks', 'thank']);
const negative = new Set(['bad', 'terrible', 'awful', 'unhappy', 'angry', 'frustrated', 'hate', 'poor', 'disappointed', 'wrong', 'problem', 'issue', 'worried', 'anxious', 'overwhelmed', 'sad']);
const formal = new Set(['please', 'therefore', 'however', 'regarding', 'appreciate', 'completed', 'professional', 'documentation', 'summary', 'request', 'require', 'accordingly', 'sincerely']);
const informal = new Set(['hey', 'lol', 'gonna', 'wanna', 'yeah', 'nah', 'mate', 'stuff', 'kinda', 'sorta', 'now']);
const stopwords = new Set(['a','an','and','are','as','at','be','been','but','by','can','did','do','does','for','from','had','has','have','he','her','hers','him','his','i','if','in','into','is','it','its','me','my','of','on','or','our','she','so','that','the','their','them','there','they','this','to','was','we','were','what','when','where','which','who','will','with','would','you','your','now','just','very','really','please']);

export class PersonaSignalAnalyzer {
  analyze(text: string): PersonaMetrics {
    const words = text.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter(Boolean).map((word) => word.replace(/^'+|'+$/g, ''));
    const positiveCount = words.filter((word) => positive.has(word)).length;
    const negativeCount = words.filter((word) => negative.has(word)).length;
    const matches = positiveCount + negativeCount;
    const sentimentPolarity = matches > 0 ? (positiveCount - negativeCount) / matches : 0;
    const contractions = text.toLowerCase().match(/\b[\p{L}]+'[\p{L}]+\b/gu)?.length ?? 0;
    const formalMarkers = words.filter((word) => formal.has(word)).length;
    const informalMarkers = words.filter((word) => informal.has(word)).length;
    const wordCount = Math.max(1, words.length);
    const sentenceCount = Math.max(1, text.match(/[.!?]+/g)?.length ?? 0);
    const averageSentenceLength = wordCount / sentenceCount;
    let formality = 0.55;
    formality += Math.min(0.2, formalMarkers / wordCount * 5);
    formality += Math.min(0.1, Math.max(0, (averageSentenceLength - 8) / 80));
    formality -= Math.min(0.35, contractions / wordCount * 8);
    formality -= Math.min(0.25, informalMarkers / wordCount * 6);
    formality = clamp(formality);
    const emotionalIntensity = clamp(Math.abs(sentimentPolarity) * 0.7 + Math.min(0.3, ((text.match(/!/g)?.length ?? 0) + (text.match(/\?/g)?.length ?? 0)) * 0.08));
    const mood = sentimentPolarity >= 0.45 ? 'positive' : sentimentPolarity >= 0.1 ? 'engaged' : sentimentPolarity <= -0.45 ? 'frustrated' : sentimentPolarity <= -0.1 ? 'concerned' : 'neutral';
    return { sentimentPolarity: round(sentimentPolarity), formality: round(formality), emotionalIntensity: round(emotionalIntensity), label: `${mood} & ${formality >= 0.62 ? 'formal' : 'casual'}` };
  }
}

export class BehavioralDriftTracker {
  private readonly observations: PersonaDriftObservation[] = [];
  private readonly analyzer = new PersonaSignalAnalyzer();

  public constructor(private readonly windowSize = 3, private readonly driftThreshold = 0.2) {
    if (windowSize < 2) throw new Error('Behavioral drift window must contain at least two observations.');
    if (driftThreshold <= 0 || driftThreshold > 1) throw new Error('Behavioral drift threshold must be within (0, 1].');
  }

  observe(text: string, observedAt = new Date().toISOString()): PersonaDriftObservation {
    const metrics = this.analyzer.analyze(text);
    const samples = this.observations.slice(-this.windowSize);
    const baseline = samples.length === 0 ? null : {
      sentimentPolarity: round(samples.reduce((sum, item) => sum + item.metrics.sentimentPolarity, 0) / samples.length),
      formality: round(samples.reduce((sum, item) => sum + item.metrics.formality, 0) / samples.length),
    };
    const sentiment = baseline === null ? 0 : Math.abs(metrics.sentimentPolarity - baseline.sentimentPolarity);
    const formalityDelta = baseline === null ? 0 : Math.abs(metrics.formality - baseline.formality);
    const driftScore = Math.max(sentiment, formalityDelta);
    const driftEvent = samples.length >= this.windowSize && driftScore >= this.driftThreshold;
    const observation: PersonaDriftObservation = {
      observedAt,
      metrics,
      baseline,
      deltas: { sentiment: round(sentiment), formality: round(formalityDelta) },
      driftScore: round(driftScore),
      driftEvent,
      triggers: driftEvent ? extractTriggers(text) : [],
      model: 'adaptive-persona-v2',
    };
    this.observations.push(observation);
    if (this.observations.length > 200) this.observations.splice(0, this.observations.length - 200);
    return observation;
  }

  history(limit = 20): PersonaDriftObservation[] {
    return this.observations.slice(-Math.max(0, limit));
  }
}

function extractTriggers(text: string): string[] {
  const words = text.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter((word) => word.length >= 3 && !stopwords.has(word));
  const scores = new Map<string, number>();
  for (const word of words) scores.set(word, (scores.get(word) ?? 0) + 1 + word.length / 100);
  return [...scores.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3).map(([word]) => word);
}

function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }
function round(value: number): number { return Math.round(value * 10_000) / 10_000; }
