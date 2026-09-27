<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\DTO\ReverseGeocodeRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapGeocodeRetryState;
use DateTimeImmutable;

final class MapLocationService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly FieldReferenceGateway $references,
        private readonly GeocodingService $geocoding,
        private readonly LocationFreshnessPolicy $freshness,
        private readonly GeocodeRetryPolicy $retryPolicy,
    ) {}

    public function resolve(string $referenceType, string $publicReferenceId, bool $forceRefresh = false): MapLocation
    {
        $companyId = $this->context->companyId();
        $reference = $this->references->resolve($companyId, $referenceType, $publicReferenceId);
        if ($reference === null || ! hash_equals($companyId, $reference->companyId)) {
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_NOT_FOUND', 'The requested field reference does not exist in the authorised company.', [
                'reference_type' => $referenceType,
                'public_reference_id' => $publicReferenceId,
            ]);
        }

        $existing = MapLocation::query()
            ->forCompany($companyId)
            ->where('reference_type', $referenceType)
            ->where('public_reference_id', $publicReferenceId)
            ->first();

        $address = $reference->postalAddress === null ? null : trim($reference->postalAddress);
$fingerprint = $address === null || $address === '' ? null : $this->retryPolicy->fingerprint($address);
        $addressChanged = $existing !== null && $fingerprint !== null && ! hash_equals((string) ($existing->address_fingerprint ?? ''), $fingerprint);
        $stale = $existing === null || $this->freshness->isStale((string) $existing->source, $existing->coordinates_verified_at);

        if ($existing !== null && ! $forceRefresh && ! $addressChanged && ! $stale) {
            return $existing;
        }

        if ($address === null || $address === '') {
            if ($existing !== null && ! $forceRefresh) {
                return $existing;
            }
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_ADDRESS_MISSING', 'The field reference has no postal address available for geocoding.', [
                'reference_type' => $referenceType,
                'public_reference_id' => $publicReferenceId,
            ]);
        }

        $retryState = MapGeocodeRetryState::query()->forCompany($companyId)
            ->where('reference_type',$referenceType)->where('public_reference_id',$publicReferenceId)
            ->where('address_fingerprint',$fingerprint)->first();
        if (!$forceRefresh && $retryState !== null) {
            if ($retryState->blocked_at !== null) {
                throw MapsIntelligenceException::fromCode('MAPS_GEOCODE_RETRY_BLOCKED','Automatic geocoding stopped after repeated failures; manual refresh is required.', ['retry_count'=>(int)$retryState->retry_count]);
            }
            if ($retryState->next_geocode_attempt !== null && $retryState->next_geocode_attempt->isFuture()) {
                throw MapsIntelligenceException::fromCode('MAPS_GEOCODE_RETRY_BACKOFF','Geocoding is temporarily backed off after a prior provider failure.', ['retry_count'=>(int)$retryState->retry_count,'next_attempt_at'=>$retryState->next_geocode_attempt->toAtomString()]);
            }
        }

        try {
            $result = $this->geocoding->geocode(new GeocodeRequest($address));
        } catch (ProviderException $e) {
            if (!in_array($e->errorCode(), ['MAPS_PROVIDER_QUOTA_EXCEEDED','MAPS_PROVIDER_AUTH_FAILED','MAPS_PROVIDER_NOT_CONFIGURED'], true)) {
                $failures = ((int)($retryState?->retry_count ?? 0)) + 1;
                $delay = $this->retryPolicy->retryAfterSeconds($failures);
                MapGeocodeRetryState::query()->updateOrCreate(
                    ['company_id'=>$companyId,'reference_type'=>$referenceType,'public_reference_id'=>$publicReferenceId,'address_fingerprint'=>$fingerprint],
                    ['retry_count'=>$failures,'last_geocode_attempt'=>now(),'next_geocode_attempt'=>$delay===null?null:now()->addSeconds($delay),'last_error_code'=>$e->errorCode(),'blocked_at'=>$this->retryPolicy->isBlockedAfterFailureCount($failures)?now():null]
                );
            }
            throw $e;
        }
        MapGeocodeRetryState::query()->forCompany($companyId)->where('reference_type',$referenceType)
            ->where('public_reference_id',$publicReferenceId)->where('address_fingerprint',$fingerprint)->delete();
        $now = new DateTimeImmutable('now');

        return MapLocation::query()->updateOrCreate(
            [
                'company_id' => $companyId,
                'reference_type' => $referenceType,
                'public_reference_id' => $publicReferenceId,
            ],
            [
                'branch_id' => $reference->branchId ?? $this->context->branchId(),
                'workspace_id' => $reference->workspaceId ?? $this->context->workspaceId(),
                'latitude' => $result->coordinates->latitude,
                'longitude' => $result->coordinates->longitude,
                'source' => 'geocoded',
                'precision' => $result->precision,
                'provider' => $result->provider,
                'provider_place_id' => $result->providerPlaceId,
                'address_fingerprint' => $fingerprint,
                'formatted_address' => $result->formattedAddress,
                'geocode_confidence' => $this->retryPolicy->confidenceForPrecision($result->precision),
                'geocode_version' => $this->retryPolicy->providerVersion($result->provider),
                'coordinates_verified_at' => $now,
                'geocoded_at' => $now,
            ],
        );
    }

    public function addReverseGeocodeMetadata(MapLocation $location, bool $forceRefresh = false): MapLocation
    {
        $companyId = $this->context->companyId();
        if (! hash_equals($companyId, (string) $location->company_id)) {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'A map location from another company cannot be enriched.');
        }

        if (! $forceRefresh && $location->reverse_geocoded_at !== null && ! $this->freshness->isStale('geocoded', $location->reverse_geocoded_at)) {
            return $location;
        }

        $result = $this->geocoding->reverseGeocode(new ReverseGeocodeRequest(new Coordinates(
            (float) $location->latitude,
            (float) $location->longitude,
        )));

        $location->forceFill([
            'reverse_geocode_metadata' => [
                'provider' => $result->provider,
                'provider_place_id' => $result->providerPlaceId,
                'formatted_address' => $result->formattedAddress,
                'geocode_confidence' => $this->retryPolicy->confidenceForPrecision($result->precision),
                'geocode_version' => $this->retryPolicy->providerVersion($result->provider),
                'precision' => $result->precision,
                'address_components' => $result->addressComponents,
                'observed_at' => (new DateTimeImmutable('now'))->format(DATE_ATOM),
            ],
            'reverse_geocoded_at' => new DateTimeImmutable('now'),
        ])->save();

        return $location->refresh();
    }

}
