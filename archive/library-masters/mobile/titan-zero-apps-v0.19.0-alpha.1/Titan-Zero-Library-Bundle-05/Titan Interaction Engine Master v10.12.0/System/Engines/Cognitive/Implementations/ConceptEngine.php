<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ConceptEngineInterface;
class ConceptEngine implements ConceptEngineInterface
{
    private array $concepts = [];
    private array $relationships = [];

    public function createConcept(string $name, array $attributes): void
    {
        $this->concepts[$name] = $attributes;
    }

    public function relate(string $from, string $to, string $relationship): void
    {
        $this->relationships[] = compact('from', 'to', 'relationship');
    }

    public function getConcept(string $name): array
    {
        return $this->concepts[$name] ?? [];
    }

    public function listConcepts(): array
    {
        return array_keys($this->concepts);
    }
}
