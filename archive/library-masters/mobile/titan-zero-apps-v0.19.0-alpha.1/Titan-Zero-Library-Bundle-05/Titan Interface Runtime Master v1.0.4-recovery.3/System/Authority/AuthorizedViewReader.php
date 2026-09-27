<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityRouterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;

final readonly class AuthorizedViewReader
{
    public function __construct(private ViewRegistryContract $views, private ReadAuthorityRouterContract $reads) {}

    public function read(string $viewKey, InterfaceContext $context, ReadQuery $query): AuthorityReadResult
    {
        $view=$this->views->find($viewKey);
        if ($view===null) throw new AuthorityReadException("Unknown interface view '{$viewKey}'.");
        if (! $view->visibleIn($context)) throw new AuthorityReadException('View is not authorized, safe or visible on the active product surface.');
        return $this->reads->read($context,$view->dataAuthority,$view->dataMode,$view->dataReference,$query);
    }
}
