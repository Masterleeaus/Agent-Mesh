<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Context;

use JsonSerializable;

final readonly class InterfaceContext implements JsonSerializable
{
    public const VERSION = '1.0';

    public string $traceId;
    public string $correlationId;

    /**
     * @param list<string> $roles
     * @param list<string> $capabilities
     */
    public function __construct(
        public int|string $companyId,
        public int|string $userId,
        public string $productSurface,
        public string $domain,
        public ?int $branchId = null,
        public ?string $workspaceId = null,
        public ?string $teamId = null,
        public ?string $deviceId = null,
        public ?string $objectRef = null,
        public ?string $conversationId = null,
        public ?string $journeyId = null,
        public array $roles = [],
        public array $capabilities = [],
        string $traceId = '',
        string $correlationId = '',
        public ?string $causationId = null,
    ) {
        $this->traceId = $traceId !== '' ? $traceId : self::newId('trace');
        $this->correlationId = $correlationId !== '' ? $correlationId : self::newId('corr');
        self::assertIdentity($this->companyId, 'company_id');
        self::assertIdentity($userId, 'user_id');
        self::assertToken($productSurface, 'product_surface');
        self::assertToken($domain, 'domain');
        if ($branchId !== null && $branchId <= 0) {
            throw new ContextResolutionException('branch_id must be a positive integer when present.');
        }
        foreach ([
            'workspace_id' => $workspaceId,
            'team_id' => $teamId,
            'device_id' => $deviceId,
            'object_ref' => $objectRef,
            'conversation_id' => $conversationId,
            'journey_id' => $journeyId,
        ] as $field => $value) {
            self::assertOptionalReference($value, $field);
        }
        self::assertTrace($this->traceId, 'trace_id');
        self::assertTrace($this->correlationId, 'correlation_id');
        if ($causationId !== null) self::assertTrace($causationId, 'causation_id');
        self::assertStringList($roles, 'roles');
        self::assertStringList($capabilities, 'capabilities');
    }

    /**
     * Create a child presentation context without allowing security-principal escalation.
     *
     * @param array<string, scalar|null|array<mixed>> $changes
     */
    public function with(array $changes): self
    {
        foreach (['company_id', 'company_id', 'company_id', 'user_id', 'roles', 'capabilities', 'product_surface', 'trace_id', 'correlation_id'] as $protected) {
            if (array_key_exists($protected, $changes)) {
                throw new ContextResolutionException("{$protected} cannot be changed by context propagation.");
            }
        }

        $allowed = [
            'domain', 'branch_id', 'workspace_id', 'team_id', 'device_id',
            'object_ref', 'conversation_id', 'journey_id', 'causation_id',
        ];
        foreach (array_keys($changes) as $key) {
            if (! in_array($key, $allowed, true)) {
                throw new ContextResolutionException("Unknown interface context field '{$key}'.");
            }
        }

        return new self(
            companyId: $this->companyId,
            userId: $this->userId,
            productSurface: $this->productSurface,
            domain: self::stringChange($changes, 'domain', $this->domain),
            branchId: self::intChange($changes, 'branch_id', $this->branchId),
            workspaceId: self::nullableStringChange($changes, 'workspace_id', $this->workspaceId),
            teamId: self::nullableStringChange($changes, 'team_id', $this->teamId),
            deviceId: self::nullableStringChange($changes, 'device_id', $this->deviceId),
            objectRef: self::nullableStringChange($changes, 'object_ref', $this->objectRef),
            conversationId: self::nullableStringChange($changes, 'conversation_id', $this->conversationId),
            journeyId: self::nullableStringChange($changes, 'journey_id', $this->journeyId),
            roles: $this->roles,
            capabilities: $this->capabilities,
            traceId: $this->traceId,
            correlationId: $this->correlationId,
            causationId: self::nullableStringChange($changes, 'causation_id', $this->causationId),
        );
    }

    public function hasCapability(string $capability): bool
    {
        return in_array('*', $this->capabilities, true) || in_array($capability, $this->capabilities, true);
    }

    /** @param list<string> $required */
    public function hasCapabilities(array $required): bool
    {
        foreach ($required as $capability) if (! $this->hasCapability($capability)) return false;
        return true;
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'context_version' => self::VERSION,
            'company_id' => $this->companyId,
            'user_id' => $this->userId,
            'product_surface' => $this->productSurface,
            'domain' => $this->domain,
            'branch_id' => $this->branchId,
            'workspace_id' => $this->workspaceId,
            'team_id' => $this->teamId,
            'device_id' => $this->deviceId,
            'object_ref' => $this->objectRef,
            'conversation_id' => $this->conversationId,
            'journey_id' => $this->journeyId,
            'roles' => $this->roles,
            'capabilities' => $this->capabilities,
            'trace_id' => $this->traceId,
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
        ];
    }

    private static function assertIdentity(int|string $value, string $field): void
    {
        if (is_int($value) && $value <= 0) throw new ContextResolutionException("{$field} must be a positive identifier.");
        if (is_string($value) && trim($value) === '') throw new ContextResolutionException("{$field} must be explicit.");
    }

    private static function assertToken(string $value, string $field): void
    {
        if (! preg_match('/^[a-z][a-z0-9._-]{0,63}$/', $value)) {
            throw new ContextResolutionException("{$field} contains an unsafe or unsupported token.");
        }
    }

    private static function assertOptionalReference(?string $value, string $field): void
    {
        if ($value === null) return;
        if ($value === '' || strlen($value) > 255 || preg_match('/[\x00-\x1F\x7F]/', $value)) {
            throw new ContextResolutionException("{$field} contains an invalid reference.");
        }
    }

    private static function assertTrace(string $value, string $field): void
    {
        if ($value === '' || strlen($value) > 128 || ! preg_match('/^[A-Za-z0-9._:-]+$/', $value)) {
            throw new ContextResolutionException("{$field} contains an invalid trace identifier.");
        }
    }

    private static function newId(string $prefix): string
    {
        return $prefix . '-' . bin2hex(random_bytes(16));
    }

    /** @param array<mixed> $values */
    private static function assertStringList(array $values, string $field): void
    {
        foreach ($values as $value) {
            if (! is_string($value) || $value === '' || strlen($value) > 160) {
                throw new ContextResolutionException("{$field} must contain non-empty bounded strings only.");
            }
        }
    }

    /** @param array<string, mixed> $changes */
    private static function stringChange(array $changes, string $key, string $current): string
    {
        if (! array_key_exists($key, $changes)) return $current;
        if (! is_string($changes[$key])) throw new ContextResolutionException("{$key} must be a string.");
        return $changes[$key];
    }

    /** @param array<string, mixed> $changes */
    private static function nullableStringChange(array $changes, string $key, ?string $current): ?string
    {
        if (! array_key_exists($key, $changes)) return $current;
        if ($changes[$key] === null) return null;
        if (! is_string($changes[$key])) throw new ContextResolutionException("{$key} must be a string or null.");
        return $changes[$key];
    }

    /** @param array<string, mixed> $changes */
    private static function intChange(array $changes, string $key, ?int $current): ?int
    {
        if (! array_key_exists($key, $changes)) return $current;
        if ($changes[$key] === null) return null;
        if (! is_int($changes[$key])) throw new ContextResolutionException("{$key} must be an integer or null.");
        return $changes[$key];
    }
}
