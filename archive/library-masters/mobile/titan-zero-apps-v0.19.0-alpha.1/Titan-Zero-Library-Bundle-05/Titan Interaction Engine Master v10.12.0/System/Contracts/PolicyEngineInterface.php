<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\Authority\AuthorityDecision;
use App\Extensions\InteractionEngine\System\Authority\CapabilityPolicy;

interface PolicyEngineInterface
{
    public function decide(string $capability, array $payload): AuthorityDecision;
    public function registerCapabilityPolicy(CapabilityPolicy $policy): void;
    public function evaluate(string $capability, array $payload): bool;
    public function getReasons(): array;
    public function registerPolicy(string $capability, callable $policy): void;
}
