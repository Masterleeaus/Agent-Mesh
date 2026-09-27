<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\ContextEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;

class ContextEngine implements ContextEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }
    public function build(int $userId, array $state): array
    {
        $context = Cache::get($this->tenantContext->cacheKey('context:' . $userId), []);
        $context = array_merge($context, $state);
        Cache::put($this->tenantContext->cacheKey('context:' . $userId), $context, 3600);
        return $context;
    }

    public function getContext(int $userId): array
    {
        return Cache::get($this->tenantContext->cacheKey('context:' . $userId), []);
    }

    public function updateContext(int $userId, array $data): void
    {
        $context = $this->getContext($userId);
        $context = array_merge($context, $data);
        Cache::put($this->tenantContext->cacheKey('context:' . $userId), $context, 3600);
    }

    public function clearContext(int $userId): void
    {
        Cache::forget($this->tenantContext->cacheKey('context:' . $userId));
    }
}
