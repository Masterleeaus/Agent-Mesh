<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Contracts;

interface GoSuiteRuntimeInterface
{
    /** @return array<string,mixed> */
    public function diagnostics(): array;

    /** @return array<string,mixed> */
    public function presentationIntent(
        string $companyId,
        string $actorId,
        string $intent,
        array $facts = [],
        array $roles = [],
        array $capabilities = [],
        array $metadata = []
    ): array;

    /** @param array<string,mixed> $spec @param array<string,mixed> $projection @return array<string,mixed> */
    public function render(
        string $companyId,
        string $actorId,
        array $spec,
        array $projection = [],
        array $permissions = [],
        array $device = [],
        array $connectivity = [],
        array $presentation = []
    ): array;
}
