<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Authority;

final readonly class AuthorityDecision
{
    public function __construct(
        public bool $allowed,
        public string $capability,
        public AuthorityLevel $authority,
        public array $reasons = [],
        public bool $requiresHuman = false,
        public bool $requiresApproval = false,
        public bool $requiresFreshAuthentication = false,
    ) {}

    public static function deny(string $capability, AuthorityLevel $authority, string ...$reasons): self
    {
        return new self(false, $capability, $authority, $reasons,
            requiresHuman: $authority === AuthorityLevel::UserOnly,
            requiresApproval: $authority === AuthorityLevel::ApprovalRequired,
            requiresFreshAuthentication: false,
        );
    }
}
