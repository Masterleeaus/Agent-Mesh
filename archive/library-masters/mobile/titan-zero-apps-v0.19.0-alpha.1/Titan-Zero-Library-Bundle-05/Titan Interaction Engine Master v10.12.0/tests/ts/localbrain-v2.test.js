const test = require('node:test');
const assert = require('node:assert/strict');

test('offline multinomial naive bayes classifies business and reminder intents', () => {
  const { NaiveBayesIntentClassifier } = require('../../dist/resources/ts/offline/naive-bayes-intent.js');
  const classifier = NaiveBayesIntentClassifier.createDefault();
  assert.equal(classifier.predict('Prepare a quote for the carpet cleaning job').intent, 'create_quote');
  assert.equal(classifier.predict('Remind me to call the customer tomorrow').intent, 'reminder');
});

test('device persona tracker detects drift after a stable baseline', () => {
  const { BehavioralDriftTracker } = require('../../dist/resources/ts/offline/persona-drift.js');
  const tracker = new BehavioralDriftTracker(3, 0.2);
  tracker.observe('I am pleased with the completed professional service.', '2026-08-01T09:00:00+10:00');
  tracker.observe('I am happy with the excellent detailed documentation.', '2026-08-02T09:00:00+10:00');
  tracker.observe('The result is great and I appreciate the formal summary.', '2026-08-03T09:00:00+10:00');
  const drift = tracker.observe("I'm angry, this is awful and I hate it! Fix it now!", '2026-08-04T09:00:00+10:00');
  assert.equal(drift.driftEvent, true);
  assert.ok(drift.metrics.sentimentPolarity < -0.2);
  assert.ok(drift.triggers.length > 0);
});

test('weighted memory reranker flags only same-fact contradictory values', () => {
  const { WeightedMemoryReranker } = require('../../dist/resources/ts/offline/memory-reranker.js');
  const reranker = new WeightedMemoryReranker();
  const result = reranker.rank([
    { id: 'old', content: 'Sister is moving to Portland', semanticSimilarity: 0.95, timestamp: '2026-05-01T10:00:00+10:00', emotionalIntensity: 0.3, factKey: 'sister_location', factValue: 'Portland' },
    { id: 'new', content: 'Sister now lives in Seattle', semanticSimilarity: 0.92, timestamp: '2026-08-02T10:00:00+10:00', emotionalIntensity: 0.9, factKey: 'sister_location', factValue: 'Seattle' },
    { id: 'other', content: 'Invoice paid', semanticSimilarity: 0.15, timestamp: '2026-08-03T10:00:00+10:00', emotionalIntensity: 0.1, factKey: 'invoice_status', factValue: 'paid' },
  ], new Date('2026-08-03T12:00:00+10:00'));
  assert.equal(result.mostRelevant.id, 'new');
  assert.deepEqual(result.contradictions.map((item) => item.id), ['old']);
});

test('vector clocks identify concurrency and merge causally', () => {
  const { compareVectorClocks, mergeVectorClocks, tickVectorClock, resolveCausalState } = require('../../dist/resources/ts/offline/vector-clock.js');
  assert.equal(compareVectorClocks({ phone: 2 }, { tablet: 1 }), 'concurrent');
  assert.deepEqual(tickVectorClock(mergeVectorClocks({ phone: 2 }, { tablet: 1 }), 'phone'), { phone: 3, tablet: 1 });
  const resolved = resolveCausalState(
    { clock: { phone: 2 }, updatedAt: '2026-08-03T09:00:00+10:00', payload: { mood: 'curious', notes: 'phone' } },
    { clock: { tablet: 1 }, updatedAt: '2026-08-03T10:00:00+10:00', payload: { mood: 'frustrated', notes: 'tablet' } },
    ['mood'],
  );
  assert.equal(resolved.relation, 'concurrent');
  assert.equal(resolved.state.payload.mood, 'frustrated');
  assert.equal(resolved.conflicts[0].field, 'notes');
});
