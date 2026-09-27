<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface KnowledgeExtractionEngineInterface
{
    public function extract(string $text): array;
    public function extractFacts(string $text): array;
    public function extractRelations(string $text): array;
}
