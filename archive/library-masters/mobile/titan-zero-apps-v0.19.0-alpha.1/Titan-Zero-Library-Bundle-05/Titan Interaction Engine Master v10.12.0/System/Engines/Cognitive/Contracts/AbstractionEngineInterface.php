<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface AbstractionEngineInterface
{
    public function abstract(array $instances): array;
    public function generalize(array $examples): string;
    public function classify(string $concept, array $attributes): string;
}
