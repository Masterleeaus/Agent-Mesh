<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Context;

use JsonSerializable;

final readonly class AuthenticatedContextPrincipal implements JsonSerializable
{
    /**
     * @param list<string> $roles
     * @param list<string> $capabilities
     */
    public function __construct(
        public int|string $companyId,
        public int|string $userId,
        public array $roles = [],
        public array $capabilities = [],
        public ?string $teamId = null,
    ) {
        self::assertIdentity($this->companyId, 'company_id');
        self::assertIdentity($userId, 'user_id');
        if ($this->teamId !== null && ($this->teamId === '' || strlen($this->teamId) > 255)) {
            throw new ContextResolutionException('team_id contains an invalid authenticated context value.');
        }
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'company_id' => $this->companyId,
            'user_id' => $this->userId,
            'roles' => $this->roles,
            'capabilities' => $this->capabilities,
            'team_id' => $this->teamId,
        ];
    }

    private static function assertIdentity(int|string $value, string $field): void
    {
        if (is_int($value) && $value <= 0) {
            throw new ContextResolutionException("{$field} must be a positive identifier.");
        }
        if (is_string($value) && trim($value) === '') {
            throw new ContextResolutionException("{$field} must be an explicit identifier.");
        }
    }
}
