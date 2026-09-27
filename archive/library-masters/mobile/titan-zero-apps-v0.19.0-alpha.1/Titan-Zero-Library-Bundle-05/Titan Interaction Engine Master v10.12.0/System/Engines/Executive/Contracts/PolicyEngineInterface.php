<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Contracts;

interface PolicyEngineInterface
{
    public function evaluate(string $action, array $context): bool;
    public function getViolations(string $action, array $context): array;
    public function addPolicy(string $name, callable $policy): void;
    public function listPolicies(): array;
}
