<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Management;

use App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\Models\BuilderAsset;
use App\Extensions\TitanBuilder\System\Models\BuilderPage;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Models\BuilderTemplate;
use App\Extensions\TitanBuilder\System\Models\BuilderTheme;
use App\Extensions\TitanBuilder\System\Models\PublishSnapshot;
use Illuminate\Contracts\Container\Container;

final class ManagementDashboardService
{
    public function __construct(
        private readonly BuilderRegistry $registry,
        private readonly CapabilityDiscovery $capabilities,
        private readonly ApplicationProvisioningGateway $applications,
        private readonly BuilderSettingsRepository $settings,
        private readonly Container $container,
    ) {}

    /** @return array<string,mixed> */
    public function companySummary(int $companyId): array
    {
        $apps = $this->applications->getApplications($companyId);
        return [
            'counts' => [
                'projects' => BuilderProject::query()->forCompany($companyId)->count(),
                'pages' => BuilderPage::query()->forCompany($companyId)->count(),
                'assets' => BuilderAsset::query()->forCompany($companyId)->count(),
                'themes' => BuilderTheme::query()->forCompany($companyId)->count(),
                'templates' => BuilderTemplate::query()->forCompany($companyId)->count(),
                'snapshots' => PublishSnapshot::query()->forCompany($companyId)->count(),
            ],
            'applications' => $apps,
            'capabilities' => $this->capabilities->available($companyId),
            'settings' => $this->settings->companySettings($companyId),
        ];
    }

    /** @return array<string,mixed> */
    public function platformSummary(): array
    {
        $catalogue = $this->registry->catalogue();
        return [
            'registry_counts' => [
                'components' => count($catalogue['components'] ?? []),
                'blocks' => count($catalogue['blocks'] ?? []),
                'templates' => count($catalogue['templates'] ?? []),
                'themes' => count($catalogue['themes'] ?? []),
                'surfaces' => count($catalogue['surfaces'] ?? []),
                'verticals' => count($catalogue['verticals'] ?? []),
            ],
            'capabilities' => $this->capabilities->available(),
            'settings' => $this->settings->platformSettings(),
            'package' => $this->packageMetadata(),
        ];
    }

    /** @return array<string,mixed> */
    public function diagnostics(): array
    {
        return [
            'package' => $this->packageMetadata(),
            'php' => PHP_VERSION,
            'laravel' => method_exists($this->container, 'version') ? $this->container->version() : null,
            'bindings' => [
                'crm_gateway' => $this->container->bound(\App\Extensions\TitanBuilder\System\Contracts\CrmBusinessConfigurationGateway::class),
                'titan_ai_gateway' => $this->container->bound(\App\Extensions\TitanBuilder\System\Contracts\TitanAiRuntimeGateway::class),
                'provisioning_gateway' => $this->container->bound(\App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway::class),
                'mobile_publisher' => $this->container->bound(\App\Extensions\TitanBuilder\System\Contracts\MobileApplicationDefinitionPublisher::class),
            ],
            'capabilities' => $this->capabilities->available(),
        ];
    }

    /** @return array<string,mixed> */
    private function packageMetadata(): array
    {
        $path = dirname(__DIR__, 2).'/extension.json';
        $manifest = is_file($path) ? json_decode((string) file_get_contents($path), true) : [];
        return is_array($manifest) ? $manifest : [];
    }
}
