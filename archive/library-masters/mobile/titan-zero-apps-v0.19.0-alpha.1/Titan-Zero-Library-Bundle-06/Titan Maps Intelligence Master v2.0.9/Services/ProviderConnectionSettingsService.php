<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapProviderConnection;

final class ProviderConnectionSettingsService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function save(string $provider, string $credentialReference, array $providerConfiguration = [], bool $enabled = true, int $priority = 100): MapProviderConnection
    {
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.provider.manage', ['provider' => $provider]);

        $credentialReference = trim($credentialReference);
        if ($credentialReference === '') {
            throw MapsIntelligenceException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'A Titan Vault credential reference is required.');
        }
        if ($priority < 0 || $priority > 10000) {
            throw MapsIntelligenceException::fromCode('MAPS_CONFIGURATION_INVALID', 'Provider priority must be between 0 and 10,000.');
        }

        // Validate the exact per-company override before any database write.
        $this->configuration->providerConfig($provider, $providerConfiguration);

        return MapProviderConnection::query()->updateOrCreate(
            ['company_id' => $companyId, 'provider' => $provider],
            [
                'company_id' => $companyId,
                'branch_id' => $this->context->branchId(),
                'workspace_id' => $this->context->workspaceId(),
                'credential_reference' => $credentialReference,
                'enabled' => $enabled,
                'priority' => $priority,
                'configuration' => $providerConfiguration,
            ],
        );
    }
}
