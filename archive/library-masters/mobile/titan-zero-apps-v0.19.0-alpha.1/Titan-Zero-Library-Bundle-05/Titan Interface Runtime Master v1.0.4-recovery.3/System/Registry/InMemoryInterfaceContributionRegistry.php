<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\InterfaceContributionRegistryContract;

final class InMemoryInterfaceContributionRegistry implements InterfaceContributionRegistryContract
{
    /** @var array<string, array<string, mixed>> */
    private array $contributions = [];

    public function all(): array
    {
        return $this->contributions;
    }

    public function get(string $extensionKey): ?array
    {
        return $this->contributions[$extensionKey] ?? null;
    }

    public function register(string $extensionKey, array $descriptor): void
    {
        if ($extensionKey === '') {
            throw new \InvalidArgumentException('Extension key is required.');
        }

        $this->contributions[$extensionKey] = $descriptor;
        ksort($this->contributions);
    }

    public function forget(string $extensionKey): void
    {
        unset($this->contributions[$extensionKey]);
    }

    public function has(string $extensionKey): bool
    {
        return array_key_exists($extensionKey, $this->contributions);
    }
}
