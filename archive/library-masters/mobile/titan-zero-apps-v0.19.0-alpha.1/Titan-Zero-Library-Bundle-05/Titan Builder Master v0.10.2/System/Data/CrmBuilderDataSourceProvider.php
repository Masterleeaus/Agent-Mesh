<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Data;

use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceProvider;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;

/** Read-only CRM catalog adapter. It never imports CRM models or executes queries. */
final class CrmBuilderDataSourceProvider implements DataSourceProvider
{
    public function __construct(
        private readonly BuilderRegistry $registry,
        private readonly CapabilityDiscovery $capabilities,
    ) {}

    public function definitions(?int $companyId = null): array
    {
        $definitions = [];
        foreach ($this->registry->all('data-sources') as $item) {
            if (($item['provider'] ?? null) !== 'crm') {
                continue;
            }
            $definition = DataSourceDefinition::fromArray($item);
            $definitions[] = $definition->toArray($this->capabilities->has($definition->requiredCapability, $companyId));
        }
        return $definitions;
    }
}
