<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\ModelSelectionEngineInterface;

/**
 * Rule-based selection from $requirements and a real per-model capability
 * table. Fixed during the fix pass: select() always returned 'gpt-4o' and
 * getModelCapabilities() always returned the same capability set
 * regardless of $requirements/$model.
 */
class ModelSelectionEngine implements ModelSelectionEngineInterface
{
    private array $capabilities = [
        'gpt-4o' => ['reasoning' => 'high', 'speed' => 'medium', 'vision' => true, 'cost' => 'medium'],
        'claude-3.5' => ['reasoning' => 'high', 'speed' => 'medium', 'vision' => true, 'cost' => 'medium'],
        'gemini-1.5' => ['reasoning' => 'medium', 'speed' => 'fast', 'vision' => true, 'cost' => 'low'],
    ];

    public function select(array $requirements): string
    {
        $needsVision = !empty($requirements['vision']);
        $needsSpeed = ($requirements['priority'] ?? null) === 'speed';
        $needsCost = ($requirements['priority'] ?? null) === 'cost';

        foreach ($this->capabilities as $model => $caps) {
            if ($needsVision && empty($caps['vision'])) {
                continue;
            }
            if ($needsSpeed && $caps['speed'] !== 'fast') {
                continue;
            }
            if ($needsCost && $caps['cost'] !== 'low') {
                continue;
            }
            return $model;
        }

        // No model satisfied every constraint — fall back to the highest
        // reasoning-capability model rather than an arbitrary default.
        return 'gpt-4o';
    }

    public function getAvailableModels(): array
    {
        return array_keys($this->capabilities);
    }

    public function getModelCapabilities(string $model): array
    {
        return $this->capabilities[$model] ?? [];
    }
}
