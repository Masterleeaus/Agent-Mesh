<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;

interface ReadCacheContract
{
    public function get(string $key): ?AuthorityReadResult;
    public function put(string $key, AuthorityReadResult $result): void;
    public function clear(): void;
}
