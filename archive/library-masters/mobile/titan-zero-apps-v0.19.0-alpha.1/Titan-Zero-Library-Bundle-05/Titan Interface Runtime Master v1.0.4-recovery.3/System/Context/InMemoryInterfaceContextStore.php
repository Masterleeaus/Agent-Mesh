<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Context;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;

final class InMemoryInterfaceContextStore implements InterfaceContextStoreContract
{
    private ?InterfaceContext $context = null;

    public function current(): ?InterfaceContext
    {
        return $this->context;
    }

    public function requireCurrent(): InterfaceContext
    {
        return $this->context ?? throw new ContextResolutionException('Interface context is not bound to the current scope.');
    }

    public function set(InterfaceContext $context): void
    {
        $this->context = $context;
    }

    public function clear(): void
    {
        $this->context = null;
    }
}
