<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Data\CrmBuilderDataSourceProvider;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;

final class CatalogueController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly BuilderRegistry $registry,
        private readonly CapabilityDiscovery $capabilities,
        private readonly ActionCatalog $actions,
        private readonly CrmBuilderDataSourceProvider $crmDataSources,
    ) {}

    public function __invoke(): JsonResponse
    {
        $companyId = $this->company->id();
        $catalogue = $this->registry->catalogue();
        $available = $this->capabilities->available($companyId);
        $catalogue['capabilities'] = ['available' => $available, 'authority' => 'host-capability-router'];
        $catalogue['data_sources'] = $this->crmDataSources->definitions($companyId);
        $catalogue['actions'] = array_map(static function (array $action) use ($available): array {
            $required = $action['required_capability'] ?? null;
            $action['available'] = ! is_string($required) || $required === '' || in_array($required, $available, true);
            return $action;
        }, $this->actions->all());
        return response()->json($catalogue);
    }
}
