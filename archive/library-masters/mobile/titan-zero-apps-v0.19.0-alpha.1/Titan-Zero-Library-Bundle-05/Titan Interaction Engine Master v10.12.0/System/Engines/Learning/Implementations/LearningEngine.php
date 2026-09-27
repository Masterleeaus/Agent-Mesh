<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\LearningEngineInterface;

final class LearningEngine implements LearningEngineInterface
{
    private array $models = [];

    public function learn(array $data, string $type): void
    {
        $type = trim($type);
        if ($type === '') throw new \InvalidArgumentException('Learning model type cannot be empty.');
        $existing = $this->models[$type] ?? null;
        $this->models[$type] = [
            'data' => $data,
            'version' => is_array($existing) ? ((int) ($existing['version'] ?? 0) + 1) : 1,
            'sample_count' => count($data),
            'trained_at' => gmdate(DATE_ATOM),
        ];
    }

    public function getLearnedModels(): array
    {
        return $this->models;
    }

    public function retrain(string $model): void
    {
        if (!isset($this->models[$model])) {
            throw new \OutOfBoundsException("Learned model {$model} does not exist.");
        }
        $this->models[$model]['version'] = (int) ($this->models[$model]['version'] ?? 1) + 1;
        $this->models[$model]['retrained_at'] = gmdate(DATE_ATOM);
    }
}
