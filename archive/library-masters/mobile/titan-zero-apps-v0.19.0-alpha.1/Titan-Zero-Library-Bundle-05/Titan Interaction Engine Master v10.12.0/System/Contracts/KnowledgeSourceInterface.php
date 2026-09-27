<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface KnowledgeSourceInterface
{
    public function id(): string;
    public function query(string $query, array $context = []): mixed;
    public function supports(string $type): bool;
}
