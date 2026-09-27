<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts;

interface AuditEngineInterface
{
    public function log(array $entry): void;
    public function query(array $criteria): array;
    public function getTrail(string $entity): array;
}
