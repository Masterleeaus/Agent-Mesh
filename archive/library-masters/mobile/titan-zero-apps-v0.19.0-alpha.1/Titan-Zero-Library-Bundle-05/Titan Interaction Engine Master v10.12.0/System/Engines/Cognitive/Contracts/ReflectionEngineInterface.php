<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface ReflectionEngineInterface
{
    public function reflect(array $event): array;
    public function learn(array $feedback): void;
    public function evaluate(string $decision): array;
}
