<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Contracts;

interface GovernanceEngineInterface
{
    public function log(array $event): void;
    public function getAuditTrail(string $entity): array;
    public function checkCompliance(string $domain): array;
    public function report(string $type): array;
}
