<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface ConceptEngineInterface
{
    public function createConcept(string $name, array $attributes): void;
    public function relate(string $from, string $to, string $relationship): void;
    public function getConcept(string $name): array;
    public function listConcepts(): array;
}
