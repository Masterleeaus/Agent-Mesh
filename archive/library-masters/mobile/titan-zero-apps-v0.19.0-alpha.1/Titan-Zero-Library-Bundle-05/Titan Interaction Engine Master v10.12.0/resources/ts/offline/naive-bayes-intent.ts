export interface IntentExample {
  text: string;
  intent: string;
}

export interface IntentPrediction {
  intent: string;
  confidence: number;
  alternatives: Array<{ intent: string; confidence: number }>;
  model: 'multinomial-naive-bayes-v1';
}

export class NaiveBayesIntentClassifier {
  private readonly documentCounts = new Map<string, number>();
  private readonly tokenCounts = new Map<string, Map<string, number>>();
  private readonly totalTokens = new Map<string, number>();
  private readonly vocabulary = new Set<string>();
  private documents = 0;

  public constructor(
    examples: IntentExample[],
    private readonly alpha = 1,
    private readonly unknownThreshold = 0.26,
  ) {
    if (examples.length === 0) throw new Error('At least one labelled intent example is required.');
    if (alpha <= 0) throw new Error('Naive Bayes smoothing alpha must be greater than zero.');
    this.train(examples);
  }

  static createDefault(): NaiveBayesIntentClassifier {
    return new NaiveBayesIntentClassifier(defaultCorpus());
  }

  predict(text: string): IntentPrediction {
    const tokens = tokenize(text);
    if (tokens.length === 0) {
      return { intent: 'unknown', confidence: 1, alternatives: [], model: 'multinomial-naive-bayes-v1' };
    }

    const labels = [...this.documentCounts.keys()];
    const vocabularySize = Math.max(1, this.vocabulary.size);
    const logScores = new Map<string, number>();
    for (const label of labels) {
      const documentsForLabel = this.documentCounts.get(label) ?? 0;
      const prior = (documentsForLabel + this.alpha) / (this.documents + this.alpha * labels.length);
      let score = Math.log(prior);
      const denominator = (this.totalTokens.get(label) ?? 0) + this.alpha * vocabularySize;
      const counts = this.tokenCounts.get(label) ?? new Map<string, number>();
      for (const token of tokens) {
        score += Math.log(((counts.get(token) ?? 0) + this.alpha) / denominator);
      }
      logScores.set(label, score);
    }

    const probabilities = normalizeLogScores(logScores);
    const ranked = [...probabilities.entries()].sort((left, right) => right[1] - left[1]);
    const best = ranked[0] ?? ['unknown', 1] as const;
    const intent = best[1] < this.unknownThreshold ? 'unknown' : best[0];
    return {
      intent,
      confidence: round(best[1]),
      alternatives: ranked.filter(([label]) => label !== intent).slice(0, 3).map(([label, confidence]) => ({ intent: label, confidence: round(confidence) })),
      model: 'multinomial-naive-bayes-v1',
    };
  }

  estimatedModelBytes(): number {
    const model = {
      documentCounts: Object.fromEntries(this.documentCounts),
      tokenCounts: Object.fromEntries([...this.tokenCounts.entries()].map(([label, counts]) => [label, Object.fromEntries(counts)])),
      totalTokens: Object.fromEntries(this.totalTokens),
    };
    return new TextEncoder().encode(JSON.stringify(model)).byteLength;
  }

  private train(examples: IntentExample[]): void {
    for (const example of examples) {
      const text = example.text.trim();
      const label = example.intent.trim();
      if (!text || !label) throw new Error('Every intent example requires non-empty text and intent.');
      this.documents += 1;
      this.documentCounts.set(label, (this.documentCounts.get(label) ?? 0) + 1);
      const counts = this.tokenCounts.get(label) ?? new Map<string, number>();
      for (const token of tokenize(text)) {
        this.vocabulary.add(token);
        counts.set(token, (counts.get(token) ?? 0) + 1);
        this.totalTokens.set(label, (this.totalTokens.get(label) ?? 0) + 1);
      }
      this.tokenCounts.set(label, counts);
    }
  }
}

function tokenize(text: string): string[] {
  const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 2);
  const tokens = [...words];
  for (let index = 0; index < words.length - 1; index += 1) {
    const current = words[index];
    const next = words[index + 1];
    if (current !== undefined && next !== undefined) tokens.push(`${current}_${next}`);
  }
  return tokens;
}

function normalizeLogScores(scores: Map<string, number>): Map<string, number> {
  const maximum = Math.max(...scores.values());
  const exponentials = new Map<string, number>();
  let sum = 0;
  for (const [label, score] of scores) {
    const value = Math.exp(score - maximum);
    exponentials.set(label, value);
    sum += value;
  }
  for (const [label, value] of exponentials) exponentials.set(label, sum > 0 ? value / sum : 0);
  return exponentials;
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function defaultCorpus(): IntentExample[] {
  const groups: Record<string, string[]> = {
    create_quote: ['prepare a quote for the cleaning job', 'give the customer an estimate', 'price this service', 'create a quote for carpet cleaning', 'how much will this job cost', 'send a quotation to the client'],
    schedule_job: ['book the job for monday', 'schedule a service appointment', 'arrange the next visit', 'put this cleaning job on the calendar', 'book a technician tomorrow', 'schedule the customer for friday'],
    create_invoice: ['create an invoice for the completed job', 'bill the customer', 'send the final invoice', 'invoice this service', 'prepare a bill for the client', 'generate the invoice now'],
    record_payment: ['record the payment received', 'the customer has paid', 'mark this invoice paid', 'payment came through', 'log the bank transfer', 'record cash payment'],
    create_customer: ['add a new customer', 'create customer profile', 'register this client', 'save a new contact as customer', 'onboard the customer', 'create an account for the client'],
    complete_job: ['mark the job complete', 'finish this job', 'close the completed service', 'the work is finished', 'complete the field job', 'record job completion'],
    report_damage: ['report damage at the property', 'something was broken during the job', 'record a damaged item', 'log property damage', 'create an incident for the broken window', 'report accidental damage'],
    reminder: ['remind me to call the customer', 'do not let me forget the meeting', 'remember to buy supplies', 'set a reminder for tomorrow', 'I need to take medicine at eight', 'remind me about the appointment'],
    emotional_support: ['I feel overwhelmed and need someone to talk to', 'I am upset and struggling today', 'this has been really difficult for me', 'I feel sad and need support', 'I am anxious about what happened', 'please help me calm down'],
    action_item: ['I will finish the task tomorrow', 'we should call the supplier', 'I need to send the email', 'let us follow up on monday', 'I am going to start the project', 'we must inspect the site'],
    small_talk: ['hello how are you', 'nice weather today', 'what is your favourite colour', 'I am just relaxing at home', 'good morning', 'how has your day been'],
    unknown: ['the sky is blue', '1234567890', 'lorem ipsum dolor sit amet', 'maybe perhaps later', 'random unrelated words', 'a sentence without an operational request'],
  };
  return Object.entries(groups).flatMap(([intent, texts]) => texts.map((text) => ({ text, intent })));
}
