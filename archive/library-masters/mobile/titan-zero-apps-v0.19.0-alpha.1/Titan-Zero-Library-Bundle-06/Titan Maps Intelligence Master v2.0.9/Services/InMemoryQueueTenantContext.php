<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\QueueTenantContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use Closure;

final class InMemoryQueueTenantContext implements QueueTenantContext
{
    /** @var list<string> */
    private array $stack = [];

    public function run(string $companyId, Closure $callback): mixed
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'Queued Maps work requires a non-empty company identifier.');
        }

        $this->stack[] = $companyId;
        try {
            return $callback();
        } finally {
            array_pop($this->stack);
        }
    }

    public function companyId(): string
    {
        $companyId = end($this->stack);
        if (! is_string($companyId) || $companyId === '') {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'No queued Maps company context is active.');
        }

        return $companyId;
    }
}
