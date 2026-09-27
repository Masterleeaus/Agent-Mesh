<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Contracts;

interface PatternRecognitionEngineInterface
{
    public function findPatterns(array $data): array;
    public function classify(array $features): string;
    public function cluster(array $items): array;
}
