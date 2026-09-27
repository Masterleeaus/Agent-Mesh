<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadCacheContract;

final class InMemoryReadCache implements ReadCacheContract
{
    /** @var array<string, AuthorityReadResult> */
    private array $results = [];

    public function get(string $key): ?AuthorityReadResult
    {
        return $this->results[$key] ?? null;
    }

    public function put(string $key, AuthorityReadResult $result): void
    {
        $this->results[$key] = $result;
    }

    public function clear(): void
    {
        $this->results = [];
    }
}
