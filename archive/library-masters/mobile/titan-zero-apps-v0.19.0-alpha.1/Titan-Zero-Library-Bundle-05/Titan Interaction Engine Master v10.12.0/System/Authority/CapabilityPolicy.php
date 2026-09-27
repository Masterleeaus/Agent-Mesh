<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Authority;

final readonly class CapabilityPolicy
{
    public function __construct(
        public string $capability,
        public AuthorityLevel $authority,
        public array $requiredRoles = [],
        public array $delegatedScopes = [],
        public array $numericLimits = [],
        public int $freshAuthenticationSeconds = 0,
        public int $approvalTtlSeconds = 900,
        public bool $learningOutcomeAllowed = true,
        public bool $learningContentAllowed = false,
    ) {}
}
