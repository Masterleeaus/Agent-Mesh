<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Prediction;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\NullLocalIntelligenceMemoryStore;

final class PredictiveCompletionEngine
{
    private const TRANSITION_TYPE = 'wizard_step_transition';
    private const FIELD_TYPE = 'wizard_field_value';

    private array $transitions = [];
    private array $fieldValues = [];

    /** @var array<string, true> */
    private array $hydratedTransitions = [];
    /** @var array<string, true> */
    private array $hydratedFields = [];

    // NOTE: $userId is per-call, not constructor-baked — see TemporalIntelligence's docblock for why.
    public function __construct(
        private readonly LocalIntelligenceMemoryStoreInterface $store = new NullLocalIntelligenceMemoryStore(),
        private readonly string $companyId = 'local-standalone',
    ) {}

    public function observeTransition(string $wizardId, string $fromStep, string $toStep, ?string $userId = null): void
    {
        $this->transitions[$wizardId][$fromStep][$toStep] = ($this->transitions[$wizardId][$fromStep][$toStep] ?? 0) + 1;

        $this->store->put(
            $this->companyId,
            $userId,
            null,
            self::TRANSITION_TYPE,
            "{$wizardId}:{$fromStep}->{$toStep}",
            ['wizard_id' => $wizardId, 'from' => $fromStep, 'to' => $toStep],
        );
    }

    public function observeField(string $wizardId, string $field, mixed $value, ?string $userId = null): void
    {
        $key = is_scalar($value) || $value === null ? json_encode($value, JSON_THROW_ON_ERROR) : hash('sha256', serialize($value));
        $this->fieldValues[$wizardId][$field][$key] = ['value' => $value, 'count' => ($this->fieldValues[$wizardId][$field][$key]['count'] ?? 0) + 1];

        $this->store->put(
            $this->companyId,
            $userId,
            null,
            self::FIELD_TYPE,
            "{$wizardId}:{$field}:{$key}",
            ['wizard_id' => $wizardId, 'field' => $field, 'value' => $value],
        );
    }

    public function predictNextStep(string $wizardId, string $currentStep, ?string $userId = null): array
    {
        $this->hydrateTransitions($wizardId, $currentStep, $userId);

        $counts = $this->transitions[$wizardId][$currentStep] ?? [];
        if ($counts === []) {
            return ['most_likely' => null, 'confidence' => 0.0, 'alternatives' => []];
        }
        arsort($counts);
        $total = array_sum($counts);
        $step = (string) array_key_first($counts);
        return ['most_likely' => $step, 'confidence' => round($counts[$step] / $total, 4), 'alternatives' => array_slice(array_keys($counts), 1, 3)];
    }

    public function prefill(string $wizardId, array $fields, float $minimumConfidence = 0.7, ?string $userId = null): array
    {
        $values = [];
        foreach ($fields as $field) {
            $this->hydrateField($wizardId, $field, $userId);

            $items = $this->fieldValues[$wizardId][$field] ?? [];
            if ($items === []) {
                continue;
            }
            uasort($items, static fn (array $a, array $b): int => $b['count'] <=> $a['count']);
            $best = reset($items);
            $total = array_sum(array_column($items, 'count'));
            $confidence = $best['count'] / max(1, $total);
            if ($confidence >= $minimumConfidence) {
                $values[$field] = ['value' => $best['value'], 'confidence' => round($confidence, 4)];
            }
        }
        return $values;
    }

    private function hydrateTransitions(string $wizardId, string $fromStep, ?string $userId): void
    {
        $hydrationKey = $wizardId . '|' . $fromStep . '|' . ($userId ?? '');
        if (isset($this->hydratedTransitions[$hydrationKey])) {
            return;
        }
        $this->hydratedTransitions[$hydrationKey] = true;

        $rows = $this->store->all($this->companyId, $userId, null, self::TRANSITION_TYPE, "{$wizardId}:{$fromStep}->");
        foreach ($rows as $row) {
            $to = $row['value']['to'] ?? null;
            if (is_string($to) && $to !== '') {
                $this->transitions[$wizardId][$fromStep][$to] = $row['frequency'];
            }
        }
    }

    private function hydrateField(string $wizardId, string $field, ?string $userId): void
    {
        $hydrationKey = $wizardId . '|' . $field . '|' . ($userId ?? '');
        if (isset($this->hydratedFields[$hydrationKey])) {
            return;
        }
        $this->hydratedFields[$hydrationKey] = true;

        $rows = $this->store->all($this->companyId, $userId, null, self::FIELD_TYPE, "{$wizardId}:{$field}:");
        foreach ($rows as $row) {
            $value = $row['value']['value'] ?? null;
            $encodedKey = is_scalar($value) || $value === null ? json_encode($value) : hash('sha256', serialize($value));
            $this->fieldValues[$wizardId][$field][$encodedKey] = ['value' => $value, 'count' => $row['frequency']];
        }
    }
}
