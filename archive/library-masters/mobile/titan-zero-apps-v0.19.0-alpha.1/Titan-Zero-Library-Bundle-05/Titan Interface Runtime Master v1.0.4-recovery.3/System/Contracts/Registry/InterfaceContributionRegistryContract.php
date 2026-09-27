<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

interface InterfaceContributionRegistryContract
{
    /** @return array<string, array<string, mixed>> */
    public function all(): array;

    /** @return array<string, mixed>|null */
    public function get(string $extensionKey): ?array;

    /** @param array<string, mixed> $descriptor */
    public function register(string $extensionKey, array $descriptor): void;

    public function forget(string $extensionKey): void;

    public function has(string $extensionKey): bool;
}
