<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Models\MapProviderConnection;
use Carbon\CarbonImmutable;

final class ProviderHealthService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialExecutionContextStore $contexts,
        private readonly SpatialExecutionContextFactory $contextFactory,
    ) {}

    public function status(string $provider): array
    {
        $connection = MapProviderConnection::query()->forCompany($this->context->companyId())->where('provider', $provider)->first();
        if ($connection === null) {
            throw ProviderException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'The requested maps provider is not configured.', ['provider'=>$provider]);
        }
        return [
            'provider'=>$provider,
            'enabled'=>(bool)$connection->enabled,
            'health_status'=>(string)($connection->health_status ?? 'unknown'),
            'active_credential_slot'=>(string)($connection->active_credential_slot ?? 'primary'),
            'secondary_configured'=>trim((string)($connection->secondary_credential_reference ?? '')) !== '',
            'consecutive_auth_failures'=>(int)($connection->consecutive_auth_failures ?? 0),
            'last_error_code'=>$connection->last_error_code,
            'last_error_at'=>$connection->last_error_at?->toAtomString(),
            'last_validated_at'=>$connection->last_validated_at?->toAtomString(),
        ];
    }

    public function credentialReference(MapProviderConnection $connection): string
    {
        if ((string)($connection->active_credential_slot ?? 'primary') === 'secondary') {
            $secondary = trim((string)($connection->secondary_credential_reference ?? ''));
            if ($secondary !== '') return $secondary;
        }
        return trim((string)$connection->credential_reference);
    }

    public function recordSuccess(string $provider): void
    {
        $this->recordSuccessForCompany($this->context->companyId(), $provider);
    }

    public function recordSuccessForCompany(string $companyId, string $provider): void
    {
        MapProviderConnection::query()->forCompany($companyId)->where('provider',$provider)->update([
            'consecutive_auth_failures'=>0,
            'health_status'=>'healthy',
            'last_error_code'=>null,
            'last_error_at'=>null,
            'last_validated_at'=>CarbonImmutable::now('UTC'),
        ]);
    }

    public function recordFailure(string $provider, ProviderException $exception): void
    {
        $this->recordFailureForCompany($this->context->companyId(), $provider, $exception);
    }

    public function recordFailureForCompany(string $companyId, string $provider, ProviderException $exception): void
    {
        $connection = MapProviderConnection::query()->forCompany($companyId)->where('provider',$provider)->first();
        if ($connection === null) return;
        $authFailure = $exception->errorCode() === 'MAPS_PROVIDER_AUTH_FAILED';
        $failures = $authFailure ? ((int)($connection->consecutive_auth_failures ?? 0) + 1) : (int)($connection->consecutive_auth_failures ?? 0);
        $updates = [
            'consecutive_auth_failures'=>$failures,
            'health_status'=>$authFailure ? 'auth_degraded' : 'degraded',
            'last_error_code'=>$exception->errorCode(),
            'last_error_at'=>CarbonImmutable::now('UTC'),
        ];
        $rotated = false;
        if ($authFailure && $failures >= 3 && (string)($connection->active_credential_slot ?? 'primary') === 'primary' && trim((string)($connection->secondary_credential_reference ?? '')) !== '') {
            $updates['active_credential_slot'] = 'secondary';
            $updates['health_status'] = 'failover_active';
            $updates['consecutive_auth_failures'] = 0;
            $rotated = true;
        }
        $connection->forceFill($updates)->save();
        if ($rotated) {
            try {
                $ctx=$this->contexts->current() ?? $this->contextFactory->fromInput('maps.provider.health',['execution_origin'=>'system']);
                $this->signals->publish('maps.provider.credential.rotated',$ctx,['provider'=>$provider,'active_credential_slot'=>'secondary','reason_code'=>'MAPS_PROVIDER_AUTH_FAILED']);
            } catch (\Throwable) {}
        }
    }
}
