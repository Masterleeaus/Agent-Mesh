<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Verticals;

use App\Extensions\TitanBuilder\System\Contracts\CrmBusinessConfigurationGateway;
use App\Extensions\TitanBuilder\System\Contracts\VerticalContextProvider;

final class CrmVerticalContextProvider implements VerticalContextProvider
{
    public function __construct(private readonly CrmBusinessConfigurationGateway $crm) {}

    public function current(int $companyId): array
    {
        $configuration = $this->crm->configuration($companyId);
        return [
            'vertical_slug' => is_string($configuration['vertical_slug'] ?? null) ? $configuration['vertical_slug'] : null,
            'capabilities' => array_values(array_filter((array) ($configuration['capabilities'] ?? []), 'is_string')),
            'services' => array_values((array) ($configuration['services'] ?? [])),
            'feature_flags' => (array) ($configuration['feature_flags'] ?? []),
            'authority' => 'crm',
        ];
    }
}
