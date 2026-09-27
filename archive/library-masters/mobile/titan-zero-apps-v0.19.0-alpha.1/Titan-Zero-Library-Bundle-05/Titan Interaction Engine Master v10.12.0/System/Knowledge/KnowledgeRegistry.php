<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Knowledge;

use App\Extensions\InteractionEngine\System\Contracts\KnowledgeSourceInterface;

class KnowledgeRegistry
{
    private array $sources = [];

    public function registerSource(KnowledgeSourceInterface $source): void
    {
        $this->sources[$source->id()] = $source;
    }

    public function getSource(string $id): ?KnowledgeSourceInterface
    {
        return $this->sources[$id] ?? null;
    }

    public function query(string $sourceId, string $query, array $context = []): mixed
    {
        $source = $this->getSource($sourceId);
        if (!$source) {
            throw new \RuntimeException("Knowledge source '{$sourceId}' not found.");
        }
        return $source->query($query, $context);
    }

    public function allSources(): array
    {
        return $this->sources;
    }
}
