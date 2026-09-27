<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface KnowledgeGraphEngineInterface
{
    public function addNode(string $id, string $type, array $properties): void;
    public function addEdge(string $from, string $to, string $relationship): void;
    public function query(string $start, string $relationship, int $depth): array;
    public function recommend(string $entity, string $context): array;
}
